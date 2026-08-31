import { createWorker } from 'tesseract.js'
import { DofusItem } from '../types'
import { searchDofusItems } from './dofusApi'
import { parseKamaInput } from '../utils/formatters'
import { DOFUS_RUNES, runeToDofusItem } from '../data/runesData'

export interface ParsedPurchaseLine {
  id: string
  rawText: string
  itemName: string
  matchedItem: DofusItem | null
  quantity: number
  totalPrice: number
  unitPrice: number
  confidence: number
}

// Normalized name cleaner
function cleanName(name: string): string {
  return name
    .replace(/[\[\]'"`]/g, '')
    .trim()
    .toLowerCase()
}

/**
 * Parse raw Dofus chat text lines
 */
export async function parseDofusChatText(text: string): Promise<ParsedPurchaseLine[]> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const results: ParsedPurchaseLine[] = []

  // Known patterns in Dofus chat
  // Pattern 1: [hh:mm] Vous avez acheté 100 '[Gelée Bleuet]' pour 120 000 kamas.
  // Pattern 2: Vous avez acheté 10 'Rune Trans Do So' pour 1 500 000 Kamas.
  // Pattern 3: Achat : 100x Gelée pour 1m
  // Pattern 4: 100 Gelée Bleuet 120k
  const patterns = [
    // Standard Dofus purchase chat
    /(?:\[\d{2}:\d{2}(?::\d{2})?\]\s*)?Vous avez achet[ée]\s+(\d+)\s+['"\[]?([^'\"\]]+)['"\]]?\s+pour\s+([\d\s\.,]+)\s*kamas?/i,
    // Short format: 100x Gelée pour 120 000 k
    /(\d+)\s*(?:x|\*)\s*['"\[]?([^'\"\]]+)['"\]]?\s*(?:pour|à|=)\s*([\d\s\.,kKmM]+)/i,
    // Compact line: 100 [Laine de Bouftou] 45000
    /(\d+)\s+['"\[]?([^'\"\]]+)['"\]]?\s+([\d\s\.,kKmM]+)\s*(?:k|kamas)?$/i
  ]

  for (const line of lines) {
    let matched = false

    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match) {
        const qty = parseInt(match[1].replace(/\s/g, ''), 10) || 1
        const rawName = match[2].trim()
        const priceStr = match[3].trim()
        const totalPrice = parseKamaInput(priceStr)

        if (rawName && qty > 0 && totalPrice > 0) {
          matched = true

          // Try to match item in DB
          const candidateItems = await searchDofusItems(rawName)
          let matchedItem: DofusItem | null = null

          const targetClean = cleanName(rawName)
          // Exact match priority
          matchedItem = candidateItems.find(it => cleanName(it.name) === targetClean) ||
                        candidateItems.find(it => cleanName(it.name).includes(targetClean)) ||
                        candidateItems[0] || null

          results.push({
            id: `parse_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
            rawText: line,
            itemName: matchedItem ? matchedItem.name : rawName,
            matchedItem,
            quantity: qty,
            totalPrice,
            unitPrice: Math.round(totalPrice / qty),
            confidence: matchedItem ? 0.95 : 0.7
          })
          break
        }
      }
    }

    // Fallback simple scanner if no regex matched directly
    if (!matched && (line.toLowerCase().includes('acheté') || line.toLowerCase().includes('kamas'))) {
      const numbers = line.match(/\d[\d\s\.,]*/g)
      if (numbers && numbers.length >= 2 && numbers[0] && numbers[numbers.length - 1]) {
        const firstNum = numbers[0]
        const lastNum = numbers[numbers.length - 1]
        const qty = parseInt(firstNum.replace(/\s/g, ''), 10) || 1
        const price = parseKamaInput(lastNum)
        const rawName = line
          .replace(/\[\d{2}:\d{2}\]/g, '')
          .replace(/Vous avez acheté/gi, '')
          .replace(/pour/gi, '')
          .replace(/kamas/gi, '')
          .replace(/\d[\d\s\.,]*/g, '')
          .replace(/[\[\]'"`]/g, '')
          .trim()

        if (rawName && price > 0) {
          const candidateItems = await searchDofusItems(rawName)
          const matchedItem = candidateItems[0] || null
          results.push({
            id: `parse_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
            rawText: line,
            itemName: matchedItem ? matchedItem.name : rawName,
            matchedItem,
            quantity: qty,
            totalPrice: price,
            unitPrice: Math.round(price / qty),
            confidence: 0.6
          })
        }
      }
    }
  }

  return results
}

/**
 * Perform OCR on an image file or blob using Tesseract
 */
export async function performOCROnImage(
  imageSource: File | Blob | string,
  onProgress?: (progress: number) => void
): Promise<{ text: string; lines: ParsedPurchaseLine[] }> {
  const worker = await createWorker('fra+eng')

  try {
    const ret = await worker.recognize(imageSource)
    const rawText = ret.data.text

    await worker.terminate()

    const parsedLines = await parseDofusChatText(rawText)
    return {
      text: rawText,
      lines: parsedLines
    }
  } catch (err) {
    await worker.terminate()
    throw err
  }
}
