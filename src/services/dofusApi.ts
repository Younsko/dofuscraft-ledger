import { DofusItem, DofusRecipeIngredient } from '../types'
import { DOFUS_RUNES, runeToDofusItem } from '../data/runesData'
import { POPULAR_ITEMS } from '../data/popularItems'
import { getAllItemsFromDb, saveItemsToDb } from './catalogDb'

const BASE_URL = 'https://api.dofusdu.de/dofus3/v1/fr'

// In-memory cache for fast lookups
const itemCache = new Map<number, DofusItem>()
const searchCache = new Map<string, DofusItem[]>()

// Preload runes into cache
const allRunesItems = DOFUS_RUNES.map(runeToDofusItem)
allRunesItems.forEach(item => itemCache.set(item.ankama_id, item))

// Seed popular items
POPULAR_ITEMS.forEach(item => itemCache.set(item.ankama_id, item))

// Multi-category preloaded catalog cache
const preloadedCategoryCache: Record<string, DofusItem[]> = {
  runes: allRunesItems,
  resources: [],
  equipment: [...POPULAR_ITEMS],
  consumables: [],
  all: [...allRunesItems, ...POPULAR_ITEMS]
}

let isPreloading = false
let hasInitializedFromDb = false
const catalogUpdateListeners: Set<() => void> = new Set()

export function onCatalogUpdate(cb: () => void): () => void {
  catalogUpdateListeners.add(cb)
  return () => catalogUpdateListeners.delete(cb)
}

function notifyCatalogUpdated() {
  catalogUpdateListeners.forEach(cb => {
    try {
      cb()
    } catch (e) {
      console.error(e)
    }
  })
}

/**
 * Initialize catalog from IndexedDB first, then fetch fresh/missing from API
 */
export async function preloadAllCatalogs(): Promise<void> {
  if (isPreloading) return
  isPreloading = true

  // 1. Load from IndexedDB first for instant startup
  if (!hasInitializedFromDb) {
    try {
      const stored = await getAllItemsFromDb()
      if (stored && stored.length > 0) {
        hasInitializedFromDb = true
        stored.forEach(it => {
          itemCache.set(it.ankama_id, it)
        })

        preloadedCategoryCache.resources = stored.filter(it => it.category === 'resources')
        preloadedCategoryCache.equipment = stored.filter(it => it.category === 'equipment')
        preloadedCategoryCache.consumables = stored.filter(it => it.category === 'consumables')
        preloadedCategoryCache.all = [
          ...preloadedCategoryCache.resources,
          ...preloadedCategoryCache.runes,
          ...preloadedCategoryCache.equipment,
          ...preloadedCategoryCache.consumables
        ]

        notifyCatalogUpdated()
      }
    } catch (e) {
      console.warn('Error loading from IndexedDB:', e)
    }
  }

  // 2. Fetch large batches from API
  try {
    const fetchPromises = [
      // Equipment page 1 (500 items)
      fetch(`${BASE_URL}/items/equipment?page[size]=500&page[number]=1`).then(r => r.ok ? r.json() : null),
      // Resources page 1 (500 items)
      fetch(`${BASE_URL}/items/resources?page[size]=500&page[number]=1`).then(r => r.ok ? r.json() : null),
      // Consumables page 1 (500 items)
      fetch(`${BASE_URL}/items/consumables?page[size]=500&page[number]=1`).then(r => r.ok ? r.json() : null),
      // Equipment page 2 (500 items)
      fetch(`${BASE_URL}/items/equipment?page[size]=500&page[number]=2`).then(r => r.ok ? r.json() : null),
      // Resources page 2 (500 items)
      fetch(`${BASE_URL}/items/resources?page[size]=500&page[number]=2`).then(r => r.ok ? r.json() : null)
    ]

    const [equip1, res1, cons1, equip2, res2] = await Promise.allSettled(fetchPromises)

    const newlyFetched: DofusItem[] = []

    // Helper to extract items
    const parseList = (data: any, cat: 'equipment' | 'resources' | 'consumables') => {
      const list = data?.items || (Array.isArray(data) ? data : [])
      return list.map((it: any) => ({
        ankama_id: it.ankama_id,
        name: it.name,
        type: it.type || { id: 0, name: cat === 'equipment' ? 'Équipement' : cat === 'resources' ? 'Ressource' : 'Consommable' },
        level: it.level || 1,
        image_urls: it.image_urls || { icon: `https://api.dofusdu.de/dofus3/v1/img/item/${it.ankama_id}-64.png` },
        recipe: it.recipe || undefined,
        description: it.description || '',
        category: cat
      })) as DofusItem[]
    }

    if (equip1.status === 'fulfilled' && equip1.value) {
      newlyFetched.push(...parseList(equip1.value, 'equipment'))
    }
    if (equip2.status === 'fulfilled' && equip2.value) {
      newlyFetched.push(...parseList(equip2.value, 'equipment'))
    }
    if (res1.status === 'fulfilled' && res1.value) {
      newlyFetched.push(...parseList(res1.value, 'resources'))
    }
    if (res2.status === 'fulfilled' && res2.value) {
      newlyFetched.push(...parseList(res2.value, 'resources'))
    }
    if (cons1.status === 'fulfilled' && cons1.value) {
      newlyFetched.push(...parseList(cons1.value, 'consumables'))
    }

    if (newlyFetched.length > 0) {
      newlyFetched.forEach(it => {
        itemCache.set(it.ankama_id, it)
      })

      // Re-group
      const allItemsMap = new Map<number, DofusItem>()
      // Put existing cached items
      preloadedCategoryCache.all.forEach(it => allItemsMap.set(it.ankama_id, it))
      // Add newly fetched
      newlyFetched.forEach(it => allItemsMap.set(it.ankama_id, it))
      // Add runes
      allRunesItems.forEach(it => allItemsMap.set(it.ankama_id, it))

      const allMerged = Array.from(allItemsMap.values())
      preloadedCategoryCache.equipment = allMerged.filter(it => it.category === 'equipment')
      preloadedCategoryCache.resources = allMerged.filter(it => it.category === 'resources')
      preloadedCategoryCache.consumables = allMerged.filter(it => it.category === 'consumables')
      preloadedCategoryCache.runes = allMerged.filter(it => it.category === 'runes')
      preloadedCategoryCache.all = allMerged

      // Save to IndexedDB in background
      saveItemsToDb(allMerged).catch(err => console.warn('Failed to save catalog to IndexedDB:', err))

      notifyCatalogUpdated()
    }
  } catch (err) {
    console.error('Preload catalogs error:', err)
  } finally {
    isPreloading = false
  }
}

// Start preloading immediately
preloadAllCatalogs()

export async function getPreloadedCatalog(category = 'all'): Promise<DofusItem[]> {
  if (preloadedCategoryCache.resources.length === 0 && !hasInitializedFromDb) {
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

  // 2. Search directly in memory first (super fast)
  const allInMemory = await getPreloadedCatalog(category || 'all')
  const matchedInMemory = allInMemory.filter(it => {
    if (it.level < minLevel || it.level > maxLevel) return false
    return it.name.toLowerCase().includes(trimmed) || (it.type?.name && it.type.name.toLowerCase().includes(trimmed))
  })

  // If good matches found locally, sort and return immediately
  if (matchedInMemory.length >= 10) {
    matchedInMemory.sort((a, b) => {
      const aExact = a.name.toLowerCase() === trimmed
      const bExact = b.name.toLowerCase() === trimmed
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return (b.level || 0) - (a.level || 0)
    })
    searchCache.set(cacheKey, matchedInMemory)
    return matchedInMemory
  }

  const results: DofusItem[] = [...matchedInMemory]

  // Runes search
  if (!category || category === 'all' || category === 'runes' || category === 'resources') {
    const matchedRunes = DOFUS_RUNES.filter(r =>
      r.name.toLowerCase().includes(trimmed) ||
      r.stat.toLowerCase().includes(trimmed) ||
      r.category.toLowerCase().includes(trimmed)
    ).map(runeToDofusItem)

    matchedRunes.forEach(r => {
      if (!results.some(x => x.ankama_id === r.ankama_id)) {
        results.push(r)
      }
    })
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

  const topResults = filtered.slice(0, 100)
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
