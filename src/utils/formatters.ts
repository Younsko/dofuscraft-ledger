import { PurchaseBatch, StockItem, DofusRecipeIngredient, CraftRequirement, CraftRecord } from '../types'

/**
 * Format Kamas with space separators and 'K' suffix
 * e.g. 1500000 -> "1 500 000 K"
 */
export function formatKamas(amount: number | undefined | null, showSuffix = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) return showSuffix ? '0 K' : '0'
  const rounded = Math.round(amount)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return showSuffix ? `${formatted} K` : formatted
}

/**
 * Format Kamas in compact format e.g. 1.2M K, 450k K
 */
export function formatKamasCompact(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 K'
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} Mrd K`
  }
  if (abs >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, '')} M K`
  }
  if (abs >= 10_000) {
    return `${(amount / 1_000).toFixed(1).replace(/\.0$/, '')} k K`
  }
  return formatKamas(amount)
}

/**
 * Parse user input string supporting shortcuts:
 * "1m" -> 1000000, "1.5m" -> 1500000, "500k" -> 500000, "2,5M" -> 2500000, "1 000 000" -> 1000000
 */
export function parseKamaInput(val: string | number): number {
  if (typeof val === 'number') return Math.max(0, Math.round(val))
  if (!val || typeof val !== 'string') return 0

  const cleaned = val.trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '.')
  
  if (cleaned.endsWith('mrd')) {
    const num = parseFloat(cleaned.slice(0, -3))
    return isNaN(num) ? 0 : Math.round(num * 1_000_000_000)
  }
  if (cleaned.endsWith('m')) {
    const num = parseFloat(cleaned.slice(0, -1))
    return isNaN(num) ? 0 : Math.round(num * 1_000_000)
  }
  if (cleaned.endsWith('k')) {
    const num = parseFloat(cleaned.slice(0, -1))
    return isNaN(num) ? 0 : Math.round(num * 1_000)
  }

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed))
}

/**
 * Format relative or localized date
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoString
  }
}

/**
 * Recompute stock aggregate from individual purchase batches
 */
export function buildStockFromBatches(
  batches: PurchaseBatch[],
  referencePrices: Record<number, number> = {}
): StockItem[] {
  const map = new Map<number, StockItem>()

  for (const b of batches) {
    if (b.remaining_quantity <= 0) continue

    if (!map.has(b.item_ankama_id)) {
      map.set(b.item_ankama_id, {
        item_ankama_id: b.item_ankama_id,
        name: b.item_name,
        type: b.item_type,
        icon: b.item_icon,
        level: b.item_level,
        category: b.category,
        total_quantity: 0,
        total_value: 0,
        pru: 0,
        reference_price: referencePrices[b.item_ankama_id] || b.unit_price,
        batches: []
      })
    }

    const item = map.get(b.item_ankama_id)!
    item.total_quantity += b.remaining_quantity
    item.total_value += b.remaining_quantity * b.unit_price
    item.batches.push(b)
  }

  // Calculate weighted PRU for each
  const stockItems: StockItem[] = []
  for (const item of map.values()) {
    item.pru = item.total_quantity > 0 ? Math.round(item.total_value / item.total_quantity) : 0
    stockItems.push(item)
  }

  return stockItems.sort((a, b) => b.total_value - a.total_value)
}

/**
 * Simulate craft requirements and check stock availability
 */
export function calculateCraftRequirements(
  recipe: DofusRecipeIngredient[],
  craftQty: number,
  stockItems: StockItem[],
  customReferencePrices: Record<number, number> = {}
): {
  requirements: CraftRequirement[]
  isFullySatisfied: boolean
  totalProjectedCost: number
  totalStockCost: number
  totalMissingCost: number
} {
  const stockMap = new Map<number, StockItem>()
  stockItems.forEach(it => stockMap.set(it.item_ankama_id, it))

  let isFullySatisfied = true
  let totalProjectedCost = 0
  let totalStockCost = 0
  let totalMissingCost = 0

  const requirements: CraftRequirement[] = recipe.map((ing) => {
    const required_qty = ing.quantity * craftQty
    const stock = stockMap.get(ing.item_ankama_id)
    const available_qty = stock ? stock.total_quantity : 0
    const missing_qty = Math.max(0, required_qty - available_qty)
    const is_satisfied = missing_qty === 0

    if (!is_satisfied) {
      isFullySatisfied = false
    }

    const stock_pru = stock ? stock.pru : 0
    const estimated_unit_price = customReferencePrices[ing.item_ankama_id] || stock_pru || 1000

    const used_from_stock = Math.min(required_qty, available_qty)
    const stock_cost_used = used_from_stock * stock_pru
    const missing_cost_estimated = missing_qty * estimated_unit_price
    const total_cost_contribution = stock_cost_used + missing_cost_estimated

    totalStockCost += stock_cost_used
    totalMissingCost += missing_cost_estimated
    totalProjectedCost += total_cost_contribution

    return {
      item_ankama_id: ing.item_ankama_id,
      name: ing.item_name || `Item #${ing.item_ankama_id}`,
      icon: ing.item_icon || `https://api.dofusdu.de/dofus3/v1/img/item/${ing.item_ankama_id}-64.png`,
      type: ing.item_subtype || 'Ressource',
      category: 'resources',
      required_qty,
      available_qty,
      missing_qty,
      is_satisfied,
      stock_pru,
      estimated_unit_price,
      stock_cost_used,
      missing_cost_estimated,
      total_cost_projected: total_cost_contribution
    }
  })

  return {
    requirements,
    isFullySatisfied,
    totalProjectedCost,
    totalStockCost,
    totalMissingCost
  }
}

/**
 * Execute craft FIFO deduction on batches
 */
export function executeCraftDeduction(
  targetItem: { ankama_id: number; name: string; icon: string; level: number },
  recipe: DofusRecipeIngredient[],
  craftQty: number,
  currentBatches: PurchaseBatch[],
  fallbackPrices: Record<number, number> = {}
): {
  updatedBatches: PurchaseBatch[]
  newCraftRecord: CraftRecord
  craftedBatch: PurchaseBatch
} {
  const batchesCopy: PurchaseBatch[] = JSON.parse(JSON.stringify(currentBatches))
  const consumedResources: CraftRecord['consumed_resources'] = []
  let totalCost = 0

  for (const ing of recipe) {
    let needed = ing.quantity * craftQty
    let ingTotalCost = 0
    let ingConsumedCount = 0

    // Deduct FIFO from matching batches
    for (const batch of batchesCopy) {
      if (batch.item_ankama_id === ing.item_ankama_id && batch.remaining_quantity > 0 && needed > 0) {
        const take = Math.min(batch.remaining_quantity, needed)
        batch.remaining_quantity -= take
        needed -= take
        ingConsumedCount += take
        ingTotalCost += take * batch.unit_price
      }
    }

    // If still missing (forced craft), use fallback price
    if (needed > 0) {
      const unitFallback = fallbackPrices[ing.item_ankama_id] || 1000
      ingTotalCost += needed * unitFallback
      ingConsumedCount += needed
    }

    totalCost += ingTotalCost

    consumedResources.push({
      item_ankama_id: ing.item_ankama_id,
      item_name: ing.item_name || `Item #${ing.item_ankama_id}`,
      item_icon: ing.item_icon || `https://api.dofusdu.de/dofus3/v1/img/item/${ing.item_ankama_id}-64.png`,
      quantity: ingConsumedCount,
      unit_cost: ingConsumedCount > 0 ? Math.round(ingTotalCost / ingConsumedCount) : 0,
      total_cost: ingTotalCost
    })
  }

  const unitCraftCost = craftQty > 0 ? Math.round(totalCost / craftQty) : 0

  const newCraftRecord: CraftRecord = {
    id: `craft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    item_ankama_id: targetItem.ankama_id,
    item_name: targetItem.name,
    item_icon: targetItem.icon,
    item_level: targetItem.level,
    quantity: craftQty,
    total_craft_cost: totalCost,
    unit_craft_cost: unitCraftCost,
    consumed_resources: consumedResources,
    date: new Date().toISOString()
  }

  // Create a new purchase batch representing the newly crafted items in stock
  const craftedBatch: PurchaseBatch = {
    id: `batch_crafted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    item_ankama_id: targetItem.ankama_id,
    item_name: targetItem.name,
    item_type: 'Équipement Crafté',
    item_icon: targetItem.icon,
    item_level: targetItem.level,
    category: 'equipment',
    quantity: craftQty,
    remaining_quantity: craftQty,
    total_price: totalCost,
    unit_price: unitCraftCost,
    date: new Date().toISOString(),
    note: `Craft de ${craftQty}x ${targetItem.name} (PRU: ${formatKamas(unitCraftCost)})`
  }

  return {
    updatedBatches: batchesCopy,
    newCraftRecord,
    craftedBatch
  }
}

/**
 * Get map of the latest known purchase price for every resource from purchase history
 */
export function getLatestKnownPrices(
  batches: PurchaseBatch[],
  fallbackRefPrices: Record<number, number> = {}
): Record<number, { price: number; date?: string; batchId?: string }> {
  const map: Record<number, { price: number; date?: string; batchId?: string }> = {}

  // 1. First populate with fallback reference prices
  Object.entries(fallbackRefPrices).forEach(([idStr, p]) => {
    const id = parseInt(idStr, 10)
    if (id && p > 0) {
      map[id] = { price: p }
    }
  })

  // 2. Sort batches chronologically ascending so newest batches overwrite older ones
  const sortedBatches = [...batches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  for (const b of sortedBatches) {
    if (b.unit_price > 0) {
      map[b.item_ankama_id] = {
        price: b.unit_price,
        date: b.date,
        batchId: b.id
      }
    }
  }

  return map
}

/**
 * Estimate the craft cost of an item based on the latest purchase prices of its ingredients
 */
export function estimateCraftCostFromPastPurchases(
  recipe: DofusRecipeIngredient[] = [],
  latestPrices: Record<number, { price: number; date?: string }>,
  craftMultiplier = 1
): {
  estimatedUnitCost: number
  totalEstimatedCost: number
  knownIngredientsCount: number
  totalIngredientsCount: number
  isComplete: boolean
  coveragePercent: number
  ingredients: Array<{
    item_ankama_id: number
    item_name?: string
    item_icon?: string
    quantity: number
    unitPrice: number
    totalCost: number
    hasKnownPrice: boolean
    date?: string
  }>
} {
  if (!recipe || recipe.length === 0) {
    return {
      estimatedUnitCost: 0,
      totalEstimatedCost: 0,
      knownIngredientsCount: 0,
      totalIngredientsCount: 0,
      isComplete: false,
      coveragePercent: 0,
      ingredients: []
    }
  }

  let totalUnitCost = 0
  let knownCount = 0

  const ingredients = recipe.map((ing) => {
    const known = latestPrices[ing.item_ankama_id]
    const hasKnownPrice = !!(known && known.price > 0)
    const unitPrice = hasKnownPrice ? known.price : 0
    const totalCost = unitPrice * (ing.quantity * craftMultiplier)

    if (hasKnownPrice) {
      knownCount++
      totalUnitCost += unitPrice * ing.quantity
    }

    return {
      item_ankama_id: ing.item_ankama_id,
      item_name: ing.item_name,
      item_icon: ing.item_icon,
      quantity: ing.quantity * craftMultiplier,
      unitPrice,
      totalCost,
      hasKnownPrice,
      date: known?.date
    }
  })

  const totalIngredientsCount = recipe.length
  const isComplete = knownCount === totalIngredientsCount && totalIngredientsCount > 0
  const coveragePercent = totalIngredientsCount > 0 ? Math.round((knownCount / totalIngredientsCount) * 100) : 0
  const totalEstimatedCost = totalUnitCost * craftMultiplier

  return {
    estimatedUnitCost: totalUnitCost,
    totalEstimatedCost,
    knownIngredientsCount: knownCount,
    totalIngredientsCount,
    isComplete,
    coveragePercent,
    ingredients
  }
}
