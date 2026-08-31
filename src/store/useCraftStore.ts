import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PurchaseBatch,
  StockItem,
  CraftRecord,
  SaleRecord,
  CrushRecord,
  DofusItem,
  CraftPlanItem,
  AggregatedCraftIngredient
} from '../types'
import {
  buildStockFromBatches,
  executeCraftDeduction,
  getLatestKnownPrices
} from '../utils/formatters'
import { DOFUS_SERVERS } from '../data/serversData'

export function useCraftStore() {
  // Server Selection
  const [currentServer, setCurrentServer] = useState<string>(() => {
    const saved = localStorage.getItem('dofuscraft_server_v3')
    return saved || 'draconiros'
  })

  const [hasChosenServer, setHasChosenServer] = useState<boolean>(() => {
    return localStorage.getItem('dofuscraft_server_chosen_v3') === 'true'
  })

  // Multi-server data storage keys
  const getStorageKey = (key: string) => `dofuscraft_${key}_${currentServer}_v3`

  // Batches for current server
  const [batches, setBatches] = useState<PurchaseBatch[]>(() => {
    try {
      const saved = localStorage.getItem(`dofuscraft_batches_${currentServer}_v3`) ||
                    localStorage.getItem('dofuscraft_batches_v2')
      if (saved) {
        const parsed: PurchaseBatch[] = JSON.parse(saved)
        const seen = new Set<string>()
        return parsed.filter(b => {
          if (seen.has(b.id)) return false
          seen.add(b.id)
          return true
        })
      }
    } catch (e) {
      console.error(e)
    }
    return []
  })

  // Craft History for current server
  const [craftHistory, setCraftHistory] = useState<CraftRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`dofuscraft_crafts_${currentServer}_v3`) ||
                    localStorage.getItem('dofuscraft_crafts_v2')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return []
  })

  // Sales History for current server
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`dofuscraft_sales_${currentServer}_v3`) ||
                    localStorage.getItem('dofuscraft_sales_v2')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return []
  })

  // Crushing & Rune Output History for current server
  const [crushHistory, setCrushHistory] = useState<CrushRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`dofuscraft_crushes_${currentServer}_v3`)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return []
  })

  // Reference Prices for current server
  const [referencePrices, setReferencePrices] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem(`dofuscraft_ref_prices_${currentServer}_v3`) ||
                    localStorage.getItem('dofuscraft_ref_prices_v2')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return {}
  })

  // Multi-Craft Plan Queue
  const [craftPlan, setCraftPlan] = useState<CraftPlanItem[]>(() => {
    try {
      const saved = localStorage.getItem(`dofuscraft_craft_plan_${currentServer}_v3`)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    return []
  })

  const [activeTab, setActiveTab] = useState<
    'fast-hdv' | 'workshop' | 'multi-craft' | 'inventory' | 'hdv' | 'sales' | 'encyclopedia' | 'analytics'
  >('fast-hdv')
  const [selectedItemForCraft, setSelectedItemForCraft] = useState<DofusItem | null>(null)

  // Reload data when server changes
  const switchServer = (serverId: string) => {
    setCurrentServer(serverId)
    localStorage.setItem('dofuscraft_server_v3', serverId)
    localStorage.setItem('dofuscraft_server_chosen_v3', 'true')
    setHasChosenServer(true)

    // Load server-specific state
    try {
      const bSaved = localStorage.getItem(`dofuscraft_batches_${serverId}_v3`)
      setBatches(bSaved ? JSON.parse(bSaved) : [])

      const cSaved = localStorage.getItem(`dofuscraft_crafts_${serverId}_v3`)
      setCraftHistory(cSaved ? JSON.parse(cSaved) : [])

      const sSaved = localStorage.getItem(`dofuscraft_sales_${serverId}_v3`)
      setSalesHistory(sSaved ? JSON.parse(sSaved) : [])

      const crSaved = localStorage.getItem(`dofuscraft_crushes_${serverId}_v3`)
      setCrushHistory(crSaved ? JSON.parse(crSaved) : [])

      const rSaved = localStorage.getItem(`dofuscraft_ref_prices_${serverId}_v3`)
      setReferencePrices(rSaved ? JSON.parse(rSaved) : {})

      const pSaved = localStorage.getItem(`dofuscraft_craft_plan_${serverId}_v3`)
      setCraftPlan(pSaved ? JSON.parse(pSaved) : [])
    } catch (err) {
      console.error('Error switching server data:', err)
    }
  }

  // Save to LocalStorage per server
  useEffect(() => {
    localStorage.setItem(`dofuscraft_batches_${currentServer}_v3`, JSON.stringify(batches))
  }, [batches, currentServer])

  useEffect(() => {
    localStorage.setItem(`dofuscraft_crafts_${currentServer}_v3`, JSON.stringify(craftHistory))
  }, [craftHistory, currentServer])

  useEffect(() => {
    localStorage.setItem(`dofuscraft_sales_${currentServer}_v3`, JSON.stringify(salesHistory))
  }, [salesHistory, currentServer])

  useEffect(() => {
    localStorage.setItem(`dofuscraft_crushes_${currentServer}_v3`, JSON.stringify(crushHistory))
  }, [crushHistory, currentServer])

  useEffect(() => {
    localStorage.setItem(`dofuscraft_ref_prices_${currentServer}_v3`, JSON.stringify(referencePrices))
  }, [referencePrices, currentServer])

  useEffect(() => {
    localStorage.setItem(`dofuscraft_craft_plan_${currentServer}_v3`, JSON.stringify(craftPlan))
  }, [craftPlan, currentServer])

  // Aggregated Stock Items with weighted PRU
  const stockItems: StockItem[] = useMemo(() => {
    return buildStockFromBatches(batches)
  }, [batches])

  // Latest known purchase price per item (sorted by most recent date)
  const latestKnownPrices = useMemo(() => {
    return getLatestKnownPrices(batches, referencePrices)
  }, [batches, referencePrices])

  // Latest crushing results indexed by item Ankama ID
  const latestCrushesByItem = useMemo(() => {
    const map: Record<number, CrushRecord> = {}
    for (const c of crushHistory) {
      if (!map[c.item_ankama_id]) {
        map[c.item_ankama_id] = c
      }
    }
    return map
  }, [crushHistory])

  // Key Financial KPIs
  const totalStockValue = useMemo(() => {
    return stockItems.reduce((acc, it) => acc + it.total_value, 0)
  }, [stockItems])

  const totalSpentPurchases = useMemo(() => {
    return batches.reduce((acc, b) => acc + b.total_price, 0)
  }, [batches])

  const totalNetProfit = useMemo(() => {
    return salesHistory.reduce((acc, s) => acc + s.net_profit, 0)
  }, [salesHistory])

  const totalCrushProfit = useMemo(() => {
    return crushHistory.reduce((acc, c) => acc + c.net_profit, 0)
  }, [crushHistory])

  const totalCraftCount = useMemo(() => {
    return craftHistory.reduce((acc, c) => acc + c.quantity, 0)
  }, [craftHistory])

  // Add single purchase batch
  const addPurchaseBatch = useCallback((
    batchData: Omit<PurchaseBatch, 'id' | 'remaining_quantity'>
  ) => {
    const newBatch: PurchaseBatch = {
      ...batchData,
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      remaining_quantity: batchData.quantity,
      server_id: currentServer
    }

    setBatches(prev => [newBatch, ...prev])

    if (batchData.unit_price > 0) {
      setReferencePrices(prev => ({
        ...prev,
        [batchData.item_ankama_id]: batchData.unit_price
      }))
    }

    return newBatch
  }, [currentServer])

  // Add multiple batches simultaneously (for fast indexer / OCR bulk import)
  const addMultipleBatches = useCallback((
    batchesData: Array<Omit<PurchaseBatch, 'id' | 'remaining_quantity'>>
  ) => {
    const newBatches: PurchaseBatch[] = batchesData.map(b => ({
      ...b,
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      remaining_quantity: b.quantity,
      server_id: currentServer
    }))

    setBatches(prev => [...newBatches, ...prev])

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
  }, [currentServer])

  // Delete batch
  const deleteBatch = useCallback((batchId: string) => {
    setBatches(prev => prev.filter(b => b.id !== batchId))
  }, [])

  // Clear batches by category (e.g. 'all', 'resources', 'equipment', 'runes', 'consumables')
  const clearBatchesByCategory = useCallback((category: string = 'all') => {
    if (category === 'all') {
      setBatches([])
    } else {
      setBatches(prev => prev.filter(b => b.category !== category))
    }
  }, [])

  // Update reference price
  const updateReferencePrice = useCallback((itemAnkamaId: number, price: number) => {
    setReferencePrices(prev => ({
      ...prev,
      [itemAnkamaId]: price
    }))
  }, [])

  // Execute Craft (FIFO stock deduction & batch creation)
  const executeCraft = useCallback((
    item: DofusItem,
    quantity: number,
    recipe: any[] = []
  ) => {
    const targetItem = {
      ankama_id: item.ankama_id,
      name: item.name,
      icon: item.image_urls?.icon || `https://api.dofusdu.de/dofus3/v1/img/item/${item.ankama_id}-64.png`,
      level: item.level || 1
    }

    const { updatedBatches, newCraftRecord, craftedBatch } = executeCraftDeduction(
      targetItem,
      recipe,
      quantity,
      batches,
      referencePrices
    )

    newCraftRecord.server_id = currentServer
    craftedBatch.server_id = currentServer

    setBatches([craftedBatch, ...updatedBatches])
    setCraftHistory(prev => [newCraftRecord, ...prev])
    setReferencePrices(prev => ({
      ...prev,
      [item.ankama_id]: newCraftRecord.unit_craft_cost
    }))

    return { success: true, craftRecord: newCraftRecord, craftedBatch }
  }, [batches, referencePrices, currentServer])

  // Record Sale
  const recordSale = useCallback((
    item: StockItem,
    quantity: number,
    unitSalePrice: number,
    taxRate = 0.02
  ) => {
    let remainingToSell = quantity
    const consumedBatches: Array<{ batchId: string; used: number }> = []
    let totalCostOfSold = 0

    const updatedBatches = batches.map(b => {
      if (b.item_ankama_id !== item.item_ankama_id || b.remaining_quantity <= 0 || remainingToSell <= 0) {
        return b
      }

      const canTake = Math.min(b.remaining_quantity, remainingToSell)
      totalCostOfSold += canTake * b.unit_price
      remainingToSell -= canTake
      consumedBatches.push({ batchId: b.id, used: canTake })

      return {
        ...b,
        remaining_quantity: b.remaining_quantity - canTake
      }
    })

    const actualSoldQty = quantity - remainingToSell
    const unitPru = actualSoldQty > 0 ? totalCostOfSold / actualSoldQty : item.pru
    const totalSalePrice = actualSoldQty * unitSalePrice
    const taxAmount = totalSalePrice * taxRate
    const netRevenue = totalSalePrice - taxAmount
    const netProfit = netRevenue - totalCostOfSold
    const roiPercentage = totalCostOfSold > 0 ? (netProfit / totalCostOfSold) * 100 : 0

    const saleRecord: SaleRecord = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      item_ankama_id: item.item_ankama_id,
      item_name: item.name,
      item_icon: item.icon,
      quantity: actualSoldQty,
      unit_sale_price: unitSalePrice,
      total_sale_price: totalSalePrice,
      unit_craft_cost: unitPru,
      unit_pru: unitPru,
      total_cost: totalCostOfSold,
      tax_rate: taxRate,
      total_tax: taxAmount,
      tax_amount: taxAmount,
      total_net: netRevenue,
      net_revenue: netRevenue,
      net_profit: netProfit,
      roi_percent: Math.round(roiPercentage * 10) / 10,
      roi_percentage: roiPercentage,
      date: new Date().toISOString(),
      server_id: currentServer
    }

    setBatches(updatedBatches)
    setSalesHistory(prev => [saleRecord, ...prev])
    setReferencePrices(prev => ({
      ...prev,
      [item.item_ankama_id]: unitSalePrice
    }))

    return saleRecord
  }, [batches, currentServer])

  // Record Brisage / Crushing of Items
  const recordCrush = useCallback((
    item: StockItem,
    quantity: number,
    runesObtained: Array<{
      rune: DofusItem
      quantity: number
      unitPrice: number
    }>,
    coefficientPercent = 100,
    focus?: string,
    addRunesToStock = true
  ) => {
    let remainingToCrush = quantity
    let totalCostOfCrushed = 0

    const updatedBatches = batches.map(b => {
      if (b.item_ankama_id !== item.item_ankama_id || b.remaining_quantity <= 0 || remainingToCrush <= 0) {
        return b
      }

      const canTake = Math.min(b.remaining_quantity, remainingToCrush)
      totalCostOfCrushed += canTake * b.unit_price
      remainingToCrush -= canTake

      return {
        ...b,
        remaining_quantity: b.remaining_quantity - canTake
      }
    })

    const actualCrushedQty = quantity - remainingToCrush
    const unitItemCost = actualCrushedQty > 0 ? totalCostOfCrushed / actualCrushedQty : item.pru

    const detailedRunes = runesObtained
      .filter(r => r.quantity > 0)
      .map(r => ({
        rune_ankama_id: r.rune.ankama_id,
        rune_name: r.rune.name,
        rune_icon: r.rune.image_urls?.icon || `https://api.dofusdu.de/dofus3/v1/img/item/${r.rune.ankama_id}-64.png`,
        quantity: r.quantity,
        unit_price: r.unitPrice || referencePrices[r.rune.ankama_id] || 100,
        total_value: r.quantity * (r.unitPrice || referencePrices[r.rune.ankama_id] || 100)
      }))

    const totalRunesValue = detailedRunes.reduce((acc, r) => acc + r.total_value, 0)
    const netProfit = totalRunesValue - totalCostOfCrushed
    const roiPercent = totalCostOfCrushed > 0 ? Math.round(((netProfit / totalCostOfCrushed) * 100) * 10) / 10 : 0

    const crushRecord: CrushRecord = {
      id: `crush_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      item_ankama_id: item.item_ankama_id,
      item_name: item.name,
      item_icon: item.icon,
      item_level: item.level,
      quantity_crushed: actualCrushedQty,
      item_unit_cost: unitItemCost,
      total_item_cost: totalCostOfCrushed,
      coefficient_percent: coefficientPercent,
      focus: focus || undefined,
      date: new Date().toISOString(),
      runes_obtained: detailedRunes,
      total_runes_value: totalRunesValue,
      net_profit: netProfit,
      roi_percent: roiPercent,
      server_id: currentServer
    }

    const newRuneBatches: PurchaseBatch[] = []
    if (addRunesToStock && detailedRunes.length > 0) {
      detailedRunes.forEach(r => {
        if (r.quantity > 0) {
          newRuneBatches.push({
            id: `batch_rune_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            item_ankama_id: r.rune_ankama_id,
            item_name: r.rune_name,
            item_type: 'Rune de Forgemagie',
            item_icon: r.rune_icon,
            item_level: 1,
            category: 'runes',
            quantity: r.quantity,
            remaining_quantity: r.quantity,
            total_price: r.total_value,
            unit_price: r.unit_price,
            date: new Date().toISOString(),
            note: `Issu du brisage de ${actualCrushedQty}x ${item.name}`,
            server_id: currentServer
          })
        }
      })
    }

    setBatches([...newRuneBatches, ...updatedBatches])
    setCrushHistory(prev => [crushRecord, ...prev])

    return crushRecord
  }, [batches, referencePrices, currentServer])

  const deleteCrushRecord = useCallback((crushId: string) => {
    setCrushHistory(prev => prev.filter(c => c.id !== crushId))
  }, [])

  // Multi-Craft Plan Queue Actions
  const addToCraftPlan = useCallback((item: DofusItem, quantity = 1) => {
    setCraftPlan(prev => {
      const existingIdx = prev.findIndex(p => p.item.ankama_id === item.ankama_id)
      if (existingIdx >= 0) {
        const updated = [...prev]
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity
        }
        return updated
      }

      const newPlan: CraftPlanItem = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        item,
        quantity,
        dateAdded: new Date().toISOString()
      }
      return [...prev, newPlan]
    })
  }, [])

  const updateCraftPlanQuantity = useCallback((planId: string, quantity: number) => {
    setCraftPlan(prev =>
      prev.map(p => (p.id === planId ? { ...p, quantity: Math.max(1, quantity) } : p))
    )
  }, [])

  const removeFromCraftPlan = useCallback((planId: string) => {
    setCraftPlan(prev => prev.filter(p => p.id !== planId))
  }, [])

  const clearCraftPlan = useCallback(() => {
    setCraftPlan([])
  }, [])

  // Clear data for current server
  const clearAllData = useCallback(() => {
    setBatches([])
    setCraftHistory([])
    setSalesHistory([])
    setCrushHistory([])
    setReferencePrices({})
    setCraftPlan([])
    localStorage.removeItem(`dofuscraft_batches_${currentServer}_v3`)
    localStorage.removeItem(`dofuscraft_crafts_${currentServer}_v3`)
    localStorage.removeItem(`dofuscraft_sales_${currentServer}_v3`)
    localStorage.removeItem(`dofuscraft_crushes_${currentServer}_v3`)
    localStorage.removeItem(`dofuscraft_ref_prices_${currentServer}_v3`)
    localStorage.removeItem(`dofuscraft_craft_plan_${currentServer}_v3`)
  }, [currentServer])

  // Export JSON backup
  const exportDataJson = useCallback(() => {
    const data = {
      server: currentServer,
      export_date: new Date().toISOString(),
      batches,
      craftHistory,
      salesHistory,
      crushHistory,
      referencePrices,
      craftPlan
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dofuscraft_${currentServer}_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [currentServer, batches, craftHistory, salesHistory, crushHistory, referencePrices, craftPlan])

  // Import JSON backup
  const importDataJson = useCallback((jsonContent: string) => {
    try {
      const data = JSON.parse(jsonContent)
      if (data.batches) setBatches(data.batches)
      if (data.craftHistory) setCraftHistory(data.craftHistory)
      if (data.salesHistory) setSalesHistory(data.salesHistory)
      if (data.crushHistory) setCrushHistory(data.crushHistory)
      if (data.referencePrices) setReferencePrices(data.referencePrices)
      if (data.craftPlan) setCraftPlan(data.craftPlan)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }, [])

  return {
    currentServer,
    hasChosenServer,
    switchServer,
    batches,
    stockItems,
    craftHistory,
    salesHistory,
    crushHistory,
    referencePrices,
    latestKnownPrices,
    latestCrushesByItem,
    craftPlan,
    activeTab,
    selectedItemForCraft,
    totalStockValue,
    totalSpentPurchases,
    totalNetProfit,
    totalCrushProfit,
    totalCraftCount,
    setActiveTab,
    setSelectedItemForCraft,
    addPurchaseBatch,
    addMultipleBatches,
    deleteBatch,
    clearBatchesByCategory,
    updateReferencePrice,
    executeCraft,
    recordSale,
    recordCrush,
    deleteCrushRecord,
    addToCraftPlan,
    updateCraftPlanQuantity,
    removeFromCraftPlan,
    clearCraftPlan,
    clearAllData,
    exportDataJson,
    importDataJson
  }
}
