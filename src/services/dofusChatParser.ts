import { createWorker } from 'tesseract.js'
import { DofusItem } from '../types'
import { searchDofusItems, fetchItemById, getPreloadedCatalog } from './dofusApi'
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

// Clean string for fuzzy & exact matching
function normalizeText(str: string): string {
  return str
    .replace(/[’‘`´]/g, "'")
    .replace(/[\u00A0\u202F\u2007]/g, ' ')
    .replace(/[\[\]\(\)\{\}"']/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Clean and normalize a single line before regex parsing
 */
function cleanRawLine(line: string): string {
  return line
    .replace(/[\u00A0\u202F\u2007]/g, ' ')
    .replace(/[’‘`´]/g, "'")
    // Remove leading noise or pipe before timestamps
    .replace(/^[|lI!:\s\-_]+/, '')
    // Remove timestamps like [12:15], [12:15:30], (12:15)
    .replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, '')
    // Remove leftover noise after timestamp
    .replace(/^[|lI!:\s\-_]+/, '')
    // Fix "1x" -> "1 x"
    .replace(/^(\d+)x\b/i, '$1 x')
    // Fix common OCR mistakes for "1 x" (e.g. "| x", "l x", "I x", "! x")
    .replace(/^[|lI!]\s*x\s+/i, '1 x ')
    .trim()
}

/**
 * Parse raw Dofus chat text lines
 */
export async function parseDofusChatText(text: string): Promise<ParsedPurchaseLine[]> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const results: ParsedPurchaseLine[] = []

  // Ensure preloaded catalog is ready for fast item lookup
  const preloadedItems = await getPreloadedCatalog('all')

  for (const rawLine of lines) {
    const cleaned = cleanRawLine(rawLine)
    if (!cleaned) continue

    let parsedQty: number | null = null
    let parsedName: string | null = null
    let parsedPrice: number | null = null

    // ==========================================
    // PATTERN 1: [12:15] 1 x [Tourmaline] (69 185 kamas)
    // or 10 x [Porte-bonheur de Malalfa] (1 974 kamas)
    // or with any brackets [], {}, (), ||
    // ==========================================
    const p1 = cleaned.match(/^(\d+)\s*x\s*[\[\{\|\(]?([^\]\}\)\|\(]+)[\]\}\)\|\)]?\s*\(([\d\s\.,kKmM]+)\s*(?:kamas?|k)?\)/i)
    if (p1 && p1[1] && p1[2] && p1[3]) {
      parsedQty = parseInt(p1[1].replace(/\s/g, ''), 10) || 1
      parsedName = p1[2].replace(/[\[\]\{\}\(\)\|'"`]/g, '').trim()
      parsedPrice = parseKamaInput(p1[3])
    }

    // ==========================================
    // PATTERN 2: General fallback: QTY x ITEM (PRICE)
    // ==========================================
    if (!parsedName) {
      const p2 = cleaned.match(/^(\d+)\s*x\s*(.+?)\s*\(([\d\s\.,kKmM]+)(?:\s*kamas?)?\)/i)
      if (p2 && p2[1] && p2[2] && p2[3]) {
        parsedQty = parseInt(p2[1].replace(/\s/g, ''), 10) || 1
        parsedName = p2[2].replace(/[\[\]\{\}\(\)\|'"`]/g, '').trim()
        parsedPrice = parseKamaInput(p2[3])
      }
    }

    // ==========================================
    // PATTERN 3: Standard "Vous avez acheté 100 [Gelée] pour 120 000 kamas"
    // ==========================================
    if (!parsedName) {
      const p3 = cleaned.match(/^Vous avez achet[ée]\s+(\d+)\s*['"\[]?([^'\"\]]+)['"\]]?\s*pour\s*([\d\s\.,kKmM]+)\s*kamas?/i)
      if (p3 && p3[1] && p3[2] && p3[3]) {
        parsedQty = parseInt(p3[1].replace(/\s/g, ''), 10) || 1
        parsedName = p3[2].trim()
        parsedPrice = parseKamaInput(p3[3])
      }
    }

    // ==========================================
    // PATTERN 4: 10 x [Item] pour 120k / 10x [Item] = 120k / 10 [Item] 120000
    // ==========================================
    if (!parsedName) {
      const p4 = cleaned.match(/^(\d+)\s*(?:x|\*|\s)\s*\[([^\]]+)\]\s*(?:pour|à|=|\:)?\s*([\d\s\.,kKmM]+)\s*(?:k|kamas)?$/i)
      if (p4 && p4[1] && p4[2] && p4[3]) {
        parsedQty = parseInt(p4[1].replace(/\s/g, ''), 10) || 1
        parsedName = p4[2].trim()
        parsedPrice = parseKamaInput(p4[3])
      }
    }

    // If parsed successfully
    if (parsedName && parsedQty && parsedQty > 0 && parsedPrice && parsedPrice > 0) {
      const cleanTarget = normalizeText(parsedName)

      // 1. Try exact match in preloaded catalog & runes
      let matchedItem = preloadedItems.find(it => normalizeText(it.name) === cleanTarget) || null

      // 2. Try runes dataset exact/partial match
      if (!matchedItem) {
        const rune = DOFUS_RUNES.find(r => normalizeText(r.name) === cleanTarget)
        if (rune) matchedItem = runeToDofusItem(rune)
      }

      // 3. Try live search API if not found
      if (!matchedItem) {
        const apiCandidates = await searchDofusItems(parsedName)
        matchedItem = apiCandidates.find(it => normalizeText(it.name) === cleanTarget) ||
                      apiCandidates.find(it => normalizeText(it.name).includes(cleanTarget)) ||
                      apiCandidates.find(it => cleanTarget.includes(normalizeText(it.name))) ||
                      null
      }

      const finalName = matchedItem ? matchedItem.name : parsedName
      const finalIcon = matchedItem?.image_urls?.icon || `https://api.dofusdu.de/dofus3/v1/img/item/0-64.png`

      results.push({
        id: `parse_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
        rawText: rawLine,
        itemName: finalName,
        matchedItem: matchedItem || {
          ankama_id: 0,
          name: finalName,
          type: { id: 0, name: 'Ressource' },
          level: 1,
          image_urls: { icon: finalIcon },
          category: 'resources'
        },
        quantity: parsedQty,
        totalPrice: parsedPrice,
        unitPrice: Math.round(parsedPrice / parsedQty),
        confidence: matchedItem ? 1.0 : 0.85
      })
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
