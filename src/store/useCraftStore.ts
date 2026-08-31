import { useState, useEffect, useCallback } from 'react'
import {
  PurchaseBatch,
  StockItem,
  CraftRecord,
  SaleRecord,
  DofusItem,
  ReferencePriceMap
} from '../types'
import { buildStockFromBatches, executeCraftDeduction } from '../utils/formatters'
import { enrichRecipeIngredients } from '../services/dofusApi'

const STORAGE_KEY_BATCHES = 'dofuscraft_batches_v2'
const STORAGE_KEY_CRAFTS = 'dofuscraft_crafts_v2'
const STORAGE_KEY_SALES = 'dofuscraft_sales_v2'
const STORAGE_KEY_REF_PRICES = 'dofuscraft_ref_prices_v2'

export function useCraftStore() {
  // Pure clean state - NO mock data by default
  const [batches, setBatches] = useState<PurchaseBatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BATCHES)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return []
  })

  const [craftHistory, setCraftHistory] = useState<CraftRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CRAFTS)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return []
  })

  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SALES)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return []
  })

  const [referencePrices, setReferencePrices] = useState<ReferencePriceMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REF_PRICES)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return {}
  })

  const [activeTab, setActiveTab] = useState<'fast-hdv' | 'workshop' | 'inventory' | 'hdv' | 'sales' | 'encyclopedia' | 'analytics'>('fast-hdv')
  const [selectedItemForCraft, setSelectedItemForCraft] = useState<DofusItem | null>(null)

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(batches))
    } catch (e) {
      console.error(e)
    }
  }, [batches])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CRAFTS, JSON.stringify(craftHistory))
    } catch (e) {
      console.error(e)
    }
  }, [craftHistory])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(salesHistory))
    } catch (e) {
      console.error(e)
    }
  }, [salesHistory])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REF_PRICES, JSON.stringify(referencePrices))
    } catch (e) {
      console.error(e)
    }
  }, [referencePrices])

  // Computed Stock
  const stockItems: StockItem[] = buildStockFromBatches(batches, referencePrices)

  // Total Stock Value & Totals
  const totalStockValue = stockItems.reduce((acc, it) => acc + it.total_value, 0)
  const totalSpentPurchases = batches.reduce((acc, b) => acc + b.total_price, 0)
  const totalNetProfit = salesHistory.reduce((acc, s) => acc + s.net_profit, 0)
  const totalCraftCount = craftHistory.reduce((acc, c) => acc + c.quantity, 0)

  // Add a purchase batch
  const addPurchaseBatch = useCallback((
    batchData: Omit<PurchaseBatch, 'id' | 'remaining_quantity'>
  ) => {
    const newBatch: PurchaseBatch = {
      ...batchData,
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      remaining_quantity: batchData.quantity
    }

    setBatches(prev => [newBatch, ...prev])

    // Update reference price
    if (batchData.unit_price > 0) {
      setReferencePrices(prev => ({
        ...prev,
        [batchData.item_ankama_id]: batchData.unit_price
      }))
    }

    return newBatch
  }, [])

  // Add multiple batches simultaneously (for fast indexer / OCR bulk import)
  const addMultipleBatches = useCallback((
    batchesData: Array<Omit<PurchaseBatch, 'id' | 'remaining_quantity'>>
  ) => {
    const newBatches: PurchaseBatch[] = batchesData.map(b => ({
      ...b,
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      remaining_quantity: b.quantity
    }))

    setBatches(prev => [...newBatches, ...prev])

    // Update reference prices for all added items
    setReferencePrices(prev => {
      const updated = { ...prev }
      batchesData.forEach(b => {
        if (b.unit_price > 0) {
          updated[b.item_ankama_id] = b.unit_price
        }
      })
      return updated
    })

    return newBatches
  }, [])

  // Delete batch
  const deleteBatch = useCallback((batchId: string) => {
    setBatches(prev => prev.filter(b => b.id !== batchId))
  }, [])

  // Update Reference Price
  const updateReferencePrice = useCallback((ankama_id: number, price: number) => {
    setReferencePrices(prev => ({
      ...prev,
      [ankama_id]: Math.max(0, Math.round(price))
    }))
  }, [])

  // Execute a craft
  const executeCraft = useCallback(async (
    targetItem: DofusItem,
    craftQty: number
  ) => {
    if (!targetItem.recipe || targetItem.recipe.length === 0 || craftQty <= 0) {
      return { success: false, error: 'Recette invalide ou quantité nulle.' }
    }

    // Enrich recipe with full names and icons if needed
    const enrichedRecipe = await enrichRecipeIngredients(targetItem.recipe)

    const result = executeCraftDeduction(
      {
        ankama_id: targetItem.ankama_id,
        name: targetItem.name,
        icon: targetItem.image_urls.icon,
        level: targetItem.level
      },
      enrichedRecipe,
      craftQty,
      batches,
      referencePrices
    )

    // Update state
    setBatches(result.updatedBatches)
    setCraftHistory(prev => [result.newCraftRecord, ...prev])

    return {
      success: true,
      craftRecord: result.newCraftRecord,
      craftedBatch: result.craftedBatch
    }
  }, [batches, referencePrices])

  // Record a sale
  const recordSale = useCallback((
    item_ankama_id: number,
    item_name: string,
    item_icon: string,
    quantity: number,
    unit_sale_price: number,
    tax_percent = 2
  ) => {
    if (quantity <= 0 || unit_sale_price <= 0) return { success: false, error: 'Valeurs invalides' }

    const batchesCopy: PurchaseBatch[] = JSON.parse(JSON.stringify(batches))
    let needed = quantity
    let totalCost = 0
    let consumed = 0

    for (const b of batchesCopy) {
      if (b.item_ankama_id === item_ankama_id && b.remaining_quantity > 0 && needed > 0) {
        const take = Math.min(b.remaining_quantity, needed)
        b.remaining_quantity -= take
        needed -= take
        consumed += take
        totalCost += take * b.unit_price
      }
    }

    const unitCraftCost = consumed > 0 ? Math.round(totalCost / consumed) : 0
    const totalGross = quantity * unit_sale_price
    const totalTax = Math.round(totalGross * (tax_percent / 100))
    const totalNet = totalGross - totalTax
    const netProfit = totalNet - totalCost
    const roiPercent = totalCost > 0 ? ((netProfit / totalCost) * 100) : 100

    const newSale: SaleRecord = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      item_ankama_id,
      item_name,
      item_icon,
      quantity,
      unit_craft_cost: unitCraftCost,
      unit_sale_price,
      tax_percent,
      total_gross: totalGross,
      total_tax: totalTax,
      total_net: totalNet,
      total_cost: totalCost,
      net_profit: netProfit,
      roi_percent: Math.round(roiPercent * 10) / 10,
      date: new Date().toISOString()
    }

    setBatches(batchesCopy)
    setSalesHistory(prev => [newSale, ...prev])
    updateReferencePrice(item_ankama_id, unit_sale_price)

    return { success: true, saleRecord: newSale }
  }, [batches, updateReferencePrice])

  // Clear all data
  const clearAllData = useCallback(() => {
    setBatches([])
    setCraftHistory([])
    setSalesHistory([])
  }, [])

  // JSON Export / Import
  const exportDataJson = useCallback(() => {
    const payload = {
      version: 2,
      exportDate: new Date().toISOString(),
      batches,
      craftHistory,
      salesHistory,
      referencePrices
    }
    return JSON.stringify(payload, null, 2)
  }, [batches, craftHistory, salesHistory, referencePrices])

  const importDataJson = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString)
      if (Array.isArray(data.batches)) setBatches(data.batches)
      if (Array.isArray(data.craftHistory)) setCraftHistory(data.craftHistory)
      if (Array.isArray(data.salesHistory)) setSalesHistory(data.salesHistory)
      if (data.referencePrices && typeof data.referencePrices === 'object') setReferencePrices(data.referencePrices)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || 'JSON invalide' }
    }
  }, [])

  return {
    batches,
    stockItems,
    craftHistory,
    salesHistory,
    referencePrices,
    activeTab,
    selectedItemForCraft,
    totalStockValue,
    totalSpentPurchases,
    totalNetProfit,
    totalCraftCount,
    setActiveTab,
    setSelectedItemForCraft,
    addPurchaseBatch,
    addMultipleBatches,
    deleteBatch,
    updateReferencePrice,
    executeCraft,
    recordSale,
    clearAllData,
    exportDataJson,
    importDataJson
  }
}
