import { DofusItem, DofusRecipeIngredient } from '../types'
import { DOFUS_RUNES, runeToDofusItem } from '../data/runesData'

const BASE_URL = 'https://api.dofusdu.de/dofus3/v1/fr'

// In-memory cache for fast lookups
const itemCache = new Map<number, DofusItem>()
const searchCache = new Map<string, DofusItem[]>()

// Preload runes into cache
const allRunesItems = DOFUS_RUNES.map(runeToDofusItem)
allRunesItems.forEach(item => itemCache.set(item.ankama_id, item))

// Multi-category preloaded catalog cache
const preloadedCategoryCache: Record<string, DofusItem[]> = {
  runes: allRunesItems,
  resources: [],
  equipment: [],
  consumables: [],
  all: []
}

let isPreloading = false

/**
 * Preload high-density catalogs across all 4 categories on startup
 */
export async function preloadAllCatalogs(): Promise<void> {
  if (isPreloading || preloadedCategoryCache.resources.length > 0) return
  isPreloading = true

  try {
    const [resRes, equipRes, consRes] = await Promise.allSettled([
      fetch(`${BASE_URL}/items/resources?page[size]=100`),
      fetch(`${BASE_URL}/items/equipment?page[size]=100`),
      fetch(`${BASE_URL}/items/consumables?page[size]=100`)
    ])

    if (resRes.status === 'fulfilled' && resRes.value.ok) {
      const data = await resRes.value.json()
      const list = data.items || data || []
      preloadedCategoryCache.resources = list.map((it: any) => ({
        ankama_id: it.ankama_id,
        name: it.name,
        type: it.type || { id: 0, name: 'Ressource' },
        level: it.level || 1,
        image_urls: it.image_urls || { icon: `https://api.dofusdu.de/dofus3/v1/img/item/${it.ankama_id}-64.png` },
        category: 'resources' as const
      }))
      preloadedCategoryCache.resources.forEach(it => itemCache.set(it.ankama_id, it))
    }

    if (equipRes.status === 'fulfilled' && equipRes.value.ok) {
      const data = await equipRes.value.json()
      const list = data.items || data || []
      preloadedCategoryCache.equipment = list.map((it: any) => ({
        ankama_id: it.ankama_id,
        name: it.name,
        type: it.type || { id: 0, name: 'Équipement' },
        level: it.level || 1,
        image_urls: it.image_urls || { icon: `https://api.dofusdu.de/dofus3/v1/img/item/${it.ankama_id}-64.png` },
        recipe: it.recipe || undefined,
        category: 'equipment' as const
      }))
      preloadedCategoryCache.equipment.forEach(it => itemCache.set(it.ankama_id, it))
    }

    if (consRes.status === 'fulfilled' && consRes.value.ok) {
      const data = await consRes.value.json()
      const list = data.items || data || []
      preloadedCategoryCache.consumables = list.map((it: any) => ({
        ankama_id: it.ankama_id,
        name: it.name,
        type: it.type || { id: 0, name: 'Consommable' },
        level: it.level || 1,
        image_urls: it.image_urls || { icon: `https://api.dofusdu.de/dofus3/v1/img/item/${it.ankama_id}-64.png` },
        recipe: it.recipe || undefined,
        category: 'consumables' as const
      }))
      preloadedCategoryCache.consumables.forEach(it => itemCache.set(it.ankama_id, it))
    }

    preloadedCategoryCache.all = [
      ...preloadedCategoryCache.resources,
      ...preloadedCategoryCache.runes,
      ...preloadedCategoryCache.equipment,
      ...preloadedCategoryCache.consumables
    ]
  } catch (err) {
    console.error('Preload catalogs error:', err)
  } finally {
    isPreloading = false
  }
}

// Start preloading immediately
preloadAllCatalogs()

export async function getPreloadedCatalog(category = 'all'): Promise<DofusItem[]> {
  if (preloadedCategoryCache.resources.length === 0) {
    await preloadAllCatalogs()
  }

  if (category === 'runes') return preloadedCategoryCache.runes
  if (category === 'resources') return preloadedCategoryCache.resources
  if (category === 'equipment') return preloadedCategoryCache.equipment
  if (category === 'consumables') return preloadedCategoryCache.consumables
  return preloadedCategoryCache.all
}

export async function searchDofusItems(
  query: string,
  category?: string,
  minLevel = 1,
  maxLevel = 200
): Promise<DofusItem[]> {
  const trimmed = query.trim().toLowerCase()

  // 1. If no query, return from preloaded category instantly
  if (!trimmed) {
    const catalog = await getPreloadedCatalog(category || 'all')
    return catalog.filter(it => it.level >= minLevel && it.level <= maxLevel)
  }

  const cacheKey = `${category || 'all'}:${trimmed}:${minLevel}-${maxLevel}`
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!
  }

  const results: DofusItem[] = []

  // Runes search
  if (!category || category === 'all' || category === 'runes' || category === 'resources') {
    const matchedRunes = DOFUS_RUNES.filter(r =>
      r.name.toLowerCase().includes(trimmed) ||
      r.stat.toLowerCase().includes(trimmed) ||
      r.category.toLowerCase().includes(trimmed)
    ).map(runeToDofusItem)
    results.push(...matchedRunes)
  }

  // Live API endpoints to query
  const endpoints: { url: string; cat: 'equipment' | 'resources' | 'consumables' }[] = []
  if (!category || category === 'all' || category === 'equipment') {
    endpoints.push({ url: `${BASE_URL}/items/equipment/search?query=${encodeURIComponent(trimmed)}`, cat: 'equipment' })
  }
  if (!category || category === 'all' || category === 'resources') {
    endpoints.push({ url: `${BASE_URL}/items/resources/search?query=${encodeURIComponent(trimmed)}`, cat: 'resources' })
  }
  if (!category || category === 'all' || category === 'consumables') {
    endpoints.push({ url: `${BASE_URL}/items/consumables/search?query=${encodeURIComponent(trimmed)}`, cat: 'consumables' })
  }

  try {
    const responses = await Promise.allSettled(
      endpoints.map(async (ep) => {
        const res = await fetch(ep.url)
        if (!res.ok) return []
        const data = await res.json()
        const items = Array.isArray(data) ? data : (data.value || data.items || [])
        return items.map((item: any) => ({
          ankama_id: item.ankama_id,
          name: item.name,
          type: item.type || { id: 0, name: 'Item' },
          level: item.level || 1,
          image_urls: item.image_urls || { icon: `https://api.dofusdu.de/dofus3/v1/img/item/${item.ankama_id}-64.png` },
          recipe: item.recipe || undefined,
          description: item.description || '',
          category: ep.cat,
          is_weapon: item.is_weapon,
          pods: item.pods
        })) as DofusItem[]
      })
    )

    for (const res of responses) {
      if (res.status === 'fulfilled') {
        for (const item of res.value) {
          if (!results.some(r => r.ankama_id === item.ankama_id)) {
            results.push(item)
            itemCache.set(item.ankama_id, item)
          }
        }
      }
    }
  } catch (err) {
    console.warn('API search error:', err)
  }

  // Filter by level range
  const filtered = results.filter(it => it.level >= minLevel && it.level <= maxLevel)

  // Sort: exact match first, then level descending
  filtered.sort((a, b) => {
    const aExact = a.name.toLowerCase() === trimmed
    const bExact = b.name.toLowerCase() === trimmed
    if (aExact && !bExact) return -1
    if (!aExact && bExact) return 1
    return (b.level || 0) - (a.level || 0)
  })

  const topResults = filtered.slice(0, 80)
  searchCache.set(cacheKey, topResults)
  return topResults
}

export async function fetchItemById(ankama_id: number, subtype = 'equipment'): Promise<DofusItem | null> {
  if (itemCache.has(ankama_id)) {
    const cached = itemCache.get(ankama_id)!
    if (cached.recipe && cached.recipe.every(r => r.item_name)) {
      return cached
    }
  }

  const endpoints = [
    `${BASE_URL}/items/${subtype}/${ankama_id}`,
    `${BASE_URL}/items/equipment/${ankama_id}`,
    `${BASE_URL}/items/resources/${ankama_id}`,
    `${BASE_URL}/items/consumables/${ankama_id}`
  ]

  for (const url of endpoints) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const item: any = await res.json()
        const parsed: DofusItem = {
          ankama_id: item.ankama_id,
          name: item.name,
          type: item.type || { id: 0, name: 'Item' },
          level: item.level || 1,
          image_urls: item.image_urls || { icon: `https://api.dofusdu.de/dofus3/v1/img/item/${item.ankama_id}-64.png` },
          recipe: item.recipe || undefined,
          description: item.description || '',
          effects: item.effects,
          is_weapon: item.is_weapon,
          pods: item.pods,
          category: subtype as any
        }
        itemCache.set(parsed.ankama_id, parsed)
        return parsed
      }
    } catch {
      // try next
    }
  }

  return itemCache.get(ankama_id) || null
}

export async function enrichRecipeIngredients(recipe: DofusRecipeIngredient[]): Promise<DofusRecipeIngredient[]> {
  if (!recipe || recipe.length === 0) return []

  return Promise.all(
    recipe.map(async (ing) => {
      if (ing.item_name && ing.item_icon) return ing

      let cached = itemCache.get(ing.item_ankama_id)
      if (!cached) {
        cached = await fetchItemById(ing.item_ankama_id, ing.item_subtype || 'resources') || undefined
      }

      return {
        ...ing,
        item_name: cached?.name || `Ressource #${ing.item_ankama_id}`,
        item_icon: cached?.image_urls?.icon || `https://api.dofusdu.de/dofus3/v1/img/item/${ing.item_ankama_id}-64.png`
      }
    })
  )
}
