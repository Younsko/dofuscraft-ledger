import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Hammer,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
  Clock,
  Globe,
  User,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react'
import { DofusItem, StockItem, DofusRecipeIngredient, MarketPriceEntry, PriceDataSource } from '../types'
import { getPreloadedCatalog, fetchItemById, enrichRecipeIngredients, onCatalogUpdate } from '../services/dofusApi'
import { formatKamas, calculateTheoreticalCraftCost } from '../utils/formatters'
import { formatMarketRelativeTime } from '../services/marketSyncService'

interface RecipeBrowserViewProps {
  stockItems: StockItem[]
  referencePrices: Record<number, number>
  latestKnownPrices?: Record<number, { price: number; date?: string }>
  marketPrices?: Record<number, MarketPriceEntry>
  priceDataSource?: PriceDataSource
  onTogglePriceDataSource?: () => void
  searchQuery: string
  onSelectForCraft: (item: DofusItem) => void
  onOpenHDVWithItem: (item: DofusItem) => void
  onUpdateRefPrice: (ankama_id: number, price: number, itemName?: string) => void
}

const ITEMS_PER_PAGE = 48

export const RecipeBrowserView: React.FC<RecipeBrowserViewProps> = ({
  stockItems,
  referencePrices,
  latestKnownPrices = {},
  marketPrices = {},
  priceDataSource = 'global',
  onTogglePriceDataSource,
  searchQuery,
  onSelectForCraft,
  onOpenHDVWithItem,
  onUpdateRefPrice
}) => {
  const [category, setCategory] = useState<string>('all')
  const [levelRange, setLevelRange] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState<'all' | 'priced' | 'unpriced'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'level_desc' | 'level_asc' | 'name_asc' | 'price_desc' | 'price_asc'>('recent')
  const [localSearch, setLocalSearch] = useState<string>(searchQuery)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Catalog items loaded in memory / IndexedDB
  const [catalogItems, setCatalogItems] = useState<DofusItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Quick edit price modal / inline popover
  const [editingPriceItem, setEditingPriceItem] = useState<DofusItem | null>(null)
  const [newPriceInput, setNewPriceInput] = useState<string>('')

  // Recipe inspection modal
  const [selectedItemDetail, setSelectedItemDetail] = useState<DofusItem | null>(null)
  const [detailedRecipe, setDetailedRecipe] = useState<DofusRecipeIngredient[]>([])
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false)

  // Map of stock quantities
  const stockMap = useMemo(() => {
    const map = new Map<number, StockItem>()
    stockItems.forEach(it => map.set(it.item_ankama_id, it))
    return map
  }, [stockItems])

  // Sync external search query
  useEffect(() => {
    setLocalSearch(searchQuery)
    setCurrentPage(1)
  }, [searchQuery])

  // Load catalog items and listen for background catalog updates
  useEffect(() => {
    let active = true

    const load = async () => {
      setIsLoading(true)
      const items = await getPreloadedCatalog('all')
      if (active) {
        setCatalogItems(items)
        setIsLoading(false)
      }
    }

    load()

    const unsubscribe = onCatalogUpdate(async () => {
      if (active) {
        const fresh = await getPreloadedCatalog('all')
        setCatalogItems(fresh)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  // Helper to get effective price & date for an item
  const getItemPriceInfo = (ankamaId: number) => {
    if (priceDataSource === 'global') {
      const marketEntry = marketPrices[ankamaId]
      if (marketEntry && marketEntry.price > 0) {
        return {
          price: marketEntry.price,
          date: marketEntry.updated_at,
          source: marketEntry.source || 'community',
          author: marketEntry.author
        }
      }
    }

    const localBatch = latestKnownPrices[ankamaId]
    if (localBatch && localBatch.price > 0) {
      return {
        price: localBatch.price,
        date: localBatch.date,
        source: 'local',
        author: 'Mon achat'
      }
    }

    const ref = referencePrices[ankamaId]
    if (ref && ref > 0) {
      return {
        price: ref,
        date: undefined,
        source: 'local',
        author: 'Relevé'
      }
    }

    return { price: 0, date: undefined, source: 'none' }
  }

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    let list = catalogItems

    // 1. Category Filter
    if (category !== 'all') {
      list = list.filter(it => it.category === category)
    }

    // 2. Level Range Filter
    if (levelRange === '200') {
      list = list.filter(it => it.level === 200)
    } else if (levelRange === '150-199') {
      list = list.filter(it => it.level >= 150 && it.level <= 199)
    } else if (levelRange === '100-149') {
      list = list.filter(it => it.level >= 100 && it.level <= 149)
    } else if (levelRange === '50-99') {
      list = list.filter(it => it.level >= 50 && it.level <= 99)
    } else if (levelRange === '1-49') {
      list = list.filter(it => it.level >= 1 && it.level <= 49)
    }

    // 3. Search Query Filter
    const query = localSearch.trim().toLowerCase()
    if (query) {
      list = list.filter(it =>
        it.name.toLowerCase().includes(query) ||
        (it.type?.name && it.type.name.toLowerCase().includes(query))
      )
    }

    // 4. Price status filter
    if (priceFilter === 'priced') {
      list = list.filter(it => getItemPriceInfo(it.ankama_id).price > 0)
    } else if (priceFilter === 'unpriced') {
      list = list.filter(it => getItemPriceInfo(it.ankama_id).price === 0)
    }

    // 5. Sorting
    const sorted = [...list]
    sorted.sort((a, b) => {
      const priceInfoA = getItemPriceInfo(a.ankama_id)
      const priceInfoB = getItemPriceInfo(b.ankama_id)

      if (sortBy === 'recent') {
        const timeA = priceInfoA.date ? new Date(priceInfoA.date).getTime() : 0
        const timeB = priceInfoB.date ? new Date(priceInfoB.date).getTime() : 0
        if (timeA !== timeB) return timeB - timeA
        return (b.level || 0) - (a.level || 0)
      }
      if (sortBy === 'level_desc') {
        return (b.level || 0) - (a.level || 0)
      }
      if (sortBy === 'level_asc') {
        return (a.level || 0) - (b.level || 0)
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'price_desc') {
        return priceInfoB.price - priceInfoA.price
      }
      if (sortBy === 'price_asc') {
        return (priceInfoA.price || 999999999) - (priceInfoB.price || 999999999)
      }
      return 0
    })

    return sorted
  }, [catalogItems, category, levelRange, localSearch, priceFilter, sortBy, marketPrices, referencePrices, latestKnownPrices, priceDataSource])

  // Pagination slice
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredItems.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredItems, currentPage])

  // Inspect recipe details
  const handleInspect = async (item: DofusItem) => {
    setSelectedItemDetail(item)
    setIsLoadingRecipe(true)

    let fullItem = item
    if (!item.recipe || item.recipe.length === 0) {
      const fetched = await fetchItemById(item.ankama_id, item.category || 'equipment')
      if (fetched) fullItem = fetched
    }

    if (fullItem.recipe && fullItem.recipe.length > 0) {
      const enriched = await enrichRecipeIngredients(fullItem.recipe)
      setDetailedRecipe(enriched)
    } else {
      setDetailedRecipe([])
    }

    setIsLoadingRecipe(false)
  }

  // Open inline price edit
  const handleStartEditPrice = (item: DofusItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const info = getItemPriceInfo(item.ankama_id)
    setEditingPriceItem(item)
    setNewPriceInput(info.price > 0 ? info.price.toString() : '')
  }

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPriceItem) return
    const price = parseInt(newPriceInput.replace(/\s+/g, '')) || 0
    if (price >= 0) {
      onUpdateRefPrice(editingPriceItem.ankama_id, price, editingPriceItem.name)
    }
    setEditingPriceItem(null)
  }

  const categories = [
    { id: 'all', label: 'Tout le Catalogue' },
    { id: 'equipment', label: 'Équipements' },
    { id: 'resources', label: 'Ressources' },
    { id: 'runes', label: 'Runes FM' },
    { id: 'consumables', label: 'Consommables' }
  ]

  const levelPresets = [
    { id: 'all', label: 'Tous niveaux' },
    { id: '200', label: 'Niv. 200' },
    { id: '150-199', label: 'Niv. 150-199' },
    { id: '100-149', label: 'Niv. 100-149' },
    { id: '50-99', label: 'Niv. 50-99' },
    { id: '1-49', label: 'Niv. 1-49' }
  ]

  const theoreticalDetail = selectedItemDetail && detailedRecipe.length > 0
    ? calculateTheoreticalCraftCost(detailedRecipe, stockMap, latestKnownPrices)
    : null

  return (
    <div className="space-y-4">
      {/* Top Filter & Control Panel */}
      <div className="bg-[#14171d] border border-[#232730] rounded-xl p-4 space-y-3.5">
        {/* Category Selector (clean text buttons, NO emojis) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCategory(c.id)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                  category === c.id
                    ? 'bg-yellow-500 text-slate-950 font-bold'
                    : 'bg-[#1c2029] text-slate-300 hover:text-white hover:bg-[#252b37]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Dofocus Global vs Local Price Mode Switcher */}
          {onTogglePriceDataSource && (
            <div className="flex items-center bg-[#0c0e12] p-0.5 rounded-lg border border-[#232730] text-xs shrink-0">
              <button
                type="button"
                onClick={() => priceDataSource !== 'global' && onTogglePriceDataSource()}
                className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition ${
                  priceDataSource === 'global'
                    ? 'bg-[#232730] text-yellow-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Cours communautaires partagés (Dofocus) avec horodatage en direct"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Cours Global</span>
              </button>
              <button
                type="button"
                onClick={() => priceDataSource !== 'local' && onTogglePriceDataSource()}
                className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition ${
                  priceDataSource === 'local'
                    ? 'bg-[#232730] text-yellow-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Uniquement vos relevés et achats personnels"
              >
                <User className="w-3.5 h-3.5" />
                <span>Relevés Locaux</span>
              </button>
            </div>
          )}
        </div>

        {/* Level Filters & Search Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-[#232730]">
          {/* Level presets */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            {levelPresets.map((lp) => (
              <button
                key={lp.id}
                onClick={() => {
                  setLevelRange(lp.id)
                  setCurrentPage(1)
                }}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  levelRange === lp.id
                    ? 'bg-[#232730] text-yellow-400 font-bold border border-[#353b47]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1c2029]'
                }`}
              >
                {lp.label}
              </button>
            ))}
          </div>

          {/* Search, Sort & Price Filter dropdowns */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Filtrer nom ou type..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#0c0e12] border border-[#232730] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-yellow-500"
              />
            </div>

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => {
                setPriceFilter(e.target.value as any)
                setCurrentPage(1)
              }}
              className="px-2.5 py-1.5 bg-[#0c0e12] border border-[#232730] rounded-lg text-xs text-slate-300 outline-none focus:border-yellow-500"
            >
              <option value="all">Tous les prix</option>
              <option value="priced">Prix indexé</option>
              <option value="unpriced">Sans prix</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-[#0c0e12] border border-[#232730] rounded-lg text-xs text-slate-300 outline-none focus:border-yellow-500 font-medium"
            >
              <option value="recent">Date mise à jour</option>
              <option value="level_desc">Niveau max</option>
              <option value="level_asc">Niveau min</option>
              <option value="price_desc">Prix max</option>
              <option value="price_asc">Prix min</option>
              <option value="name_asc">Nom A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Items Header & Count */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-400">
        <div>
          <span>Affichage de </span>
          <strong className="text-white font-mono">{filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>
          <span> à </span>
          <strong className="text-white font-mono">{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</strong>
          <span> sur </span>
          <strong className="text-yellow-400 font-mono">{filteredItems.length}</strong>
          <span> items disponibles</span>
          {priceDataSource === 'global' && (
            <span className="ml-2 text-[11px] text-slate-500">• Cours partagés Dofocus</span>
          )}
        </div>

        {/* Pagination controls top */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-[#14171d] border border-[#232730] text-slate-300 disabled:opacity-40 hover:bg-[#1c2029]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2 text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-[#14171d] border border-[#232730] text-slate-300 disabled:opacity-40 hover:bg-[#1c2029]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="bg-[#14171d] border border-[#232730] rounded-xl p-16 text-center text-slate-400 text-sm">
          Chargement du catalogue complet...
        </div>
      ) : paginatedItems.length === 0 ? (
        <div className="bg-[#14171d] border border-[#232730] rounded-xl p-16 text-center text-slate-400 text-sm">
          Aucun item ne correspond à vos filtres.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {paginatedItems.map((item) => {
            const priceInfo = getItemPriceInfo(item.ankama_id)
            const stockItem = stockMap.get(item.ankama_id)
            const stockQty = stockItem ? stockItem.total_quantity : 0

            return (
              <div
                key={item.ankama_id}
                onClick={() => handleInspect(item)}
                className="bg-[#14171d] hover:bg-[#181c24] border border-[#232730] hover:border-[#353b47] rounded-xl p-2.5 flex flex-col justify-between transition cursor-pointer group"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative w-full aspect-square bg-[#0c0e12] rounded-lg border border-[#1f242e] flex items-center justify-center p-2 mb-2">
                    <img
                      src={item.image_urls?.icon}
                      alt={item.name}
                      className="w-12 h-12 object-contain group-hover:scale-105 transition"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                      }}
                    />

                    {/* Stock Indicator */}
                    {stockQty > 0 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 bg-[#1c2029] border border-[#2b313d] text-yellow-400 text-[10px] font-mono font-bold rounded">
                        {stockQty} u
                      </span>
                    )}

                    {/* Level */}
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono text-slate-400 px-1 py-0.2 bg-[#0c0e12]/90 rounded border border-[#232730]">
                      Niv. {item.level}
                    </span>
                  </div>

                  {/* Title & Subtype */}
                  <h3 className="font-bold text-xs text-white truncate group-hover:text-yellow-400 transition" title={item.name}>
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {item.type?.name || item.category}
                  </p>
                </div>

                {/* Price & Last Update Timestamp */}
                <div className="mt-2 pt-2 border-t border-[#1f242e]">
                  <div className="flex items-center justify-between gap-1">
                    {priceInfo.price > 0 ? (
                      <div
                        onClick={(e) => handleStartEditPrice(item, e)}
                        className="truncate cursor-pointer hover:underline"
                        title="Cliquer pour ajuster le prix"
                      >
                        <span className="font-mono font-bold text-xs text-yellow-400 block">
                          {formatKamas(priceInfo.price)}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          <span className="truncate">{formatMarketRelativeTime(priceInfo.date)}</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleStartEditPrice(item, e)}
                        className="text-[10px] text-slate-500 hover:text-yellow-400 transition flex items-center gap-1"
                        title="Renseigner le prix HDV"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>Renseigner prix</span>
                      </button>
                    )}

                    {item.category === 'equipment' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectForCraft(item)
                        }}
                        className="p-1 rounded bg-[#0c0e12] hover:bg-yellow-500 hover:text-slate-950 text-slate-400 border border-[#232730] transition shrink-0"
                        title="Ouvrir dans l'Atelier de craft"
                      >
                        <Hammer className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Controls Bottom */}
      {totalPages > 1 && (
        <div className="bg-[#14171d] border border-[#232730] rounded-xl p-3 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              setCurrentPage(p => Math.max(1, p - 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg bg-[#0c0e12] border border-[#232730] text-slate-200 disabled:opacity-40 hover:bg-[#1c2029] font-medium"
          >
            Page précédente
          </button>

          <span className="font-mono text-slate-300">
            Page <strong className="text-white">{currentPage}</strong> sur <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            onClick={() => {
              setCurrentPage(p => Math.min(totalPages, p + 1))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg bg-[#0c0e12] border border-[#232730] text-slate-200 disabled:opacity-40 hover:bg-[#1c2029] font-medium"
          >
            Page suivante
          </button>
        </div>
      )}

      {/* Quick Edit Price Modal */}
      {editingPriceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#14171d] border border-[#232730] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#232730]">
              <h3 className="text-sm font-bold text-white">Actualiser le Cours HDV</h3>
              <button
                type="button"
                onClick={() => setEditingPriceItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={editingPriceItem.image_urls?.icon}
                alt={editingPriceItem.name}
                className="w-10 h-10 object-contain p-1 bg-[#0c0e12] border border-[#232730] rounded-lg"
              />
              <div className="truncate">
                <p className="font-bold text-xs text-white truncate">{editingPriceItem.name}</p>
                <p className="text-[10px] text-slate-400">Niveau {editingPriceItem.level}</p>
              </div>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nouveau Prix Unitaire (Kamas)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newPriceInput}
                    onChange={(e) => setNewPriceInput(e.target.value)}
                    placeholder="Ex: 85000"
                    autoFocus
                    className="w-full pl-3 pr-8 py-2 bg-[#0c0e12] border border-[#232730] rounded-lg text-xs font-mono text-yellow-400 outline-none focus:border-yellow-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">K</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ce cours sera enregistré avec la date et l'heure actuelle.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPriceItem(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#1c2029]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-950 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#14171d] border border-[#232730] rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#232730]">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedItemDetail.image_urls?.icon}
                  alt={selectedItemDetail.name}
                  className="w-12 h-12 object-contain p-1.5 bg-[#0c0e12] border border-[#232730] rounded-xl shrink-0"
                />
                <div className="truncate">
                  <h3 className="text-base font-bold text-white truncate">{selectedItemDetail.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Niv. {selectedItemDetail.level}</span>
                    <span>•</span>
                    <span>{selectedItemDetail.type?.name || selectedItemDetail.category}</span>
                    {getItemPriceInfo(selectedItemDetail.ankama_id).price > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-yellow-400 font-mono font-bold">
                          {formatKamas(getItemPriceInfo(selectedItemDetail.ankama_id).price)} / u
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            {selectedItemDetail.description && (
              <p className="text-xs text-slate-400 italic">
                "{selectedItemDetail.description}"
              </p>
            )}

            {/* Ingredients List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Ingrédients de Fabrication ({detailedRecipe.length})
              </h4>

              {isLoadingRecipe ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chargement des ingrédients...
                </div>
              ) : detailedRecipe.length === 0 ? (
                <div className="p-6 bg-[#0c0e12] border border-[#232730] rounded-lg text-center text-xs text-slate-500">
                  Cet item n'a pas de recette d'artisanat répertoriée (drop, quête ou achat PNJ).
                </div>
              ) : (
                <div className="divide-y divide-[#1f242e] bg-[#0c0e12] border border-[#232730] rounded-lg overflow-hidden">
                  {detailedRecipe.map((ing) => {
                    const priceInfo = getItemPriceInfo(ing.item_ankama_id)
                    const stock = stockMap.get(ing.item_ankama_id)
                    const inStock = stock ? stock.total_quantity : 0
                    const isCovered = inStock >= ing.quantity

                    return (
                      <div key={ing.item_ankama_id} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={ing.item_icon}
                            alt={ing.item_name}
                            className="w-7 h-7 object-contain shrink-0"
                          />
                          <div className="truncate">
                            <span className="font-bold text-white truncate block">{ing.item_name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span>Requis : <strong className="text-yellow-400">{ing.quantity}</strong></span>
                              <span>•</span>
                              <span className={isCovered ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                En coffre : {inStock}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {priceInfo.price > 0 ? (
                            <>
                              <span className="font-mono text-yellow-400 font-bold block">
                                {formatKamas(priceInfo.price * ing.quantity)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({formatKamas(priceInfo.price)}/u)
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">Prix non renseigné</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Theoretical Craft Summary */}
            {theoreticalDetail && (
              <div className="p-3 bg-[#0c0e12] border border-[#232730] rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Coût estimé du craft :</span>
                  <p className="text-[10px] text-slate-500">
                    {theoreticalDetail.inStockIngredientsCount}/{theoreticalDetail.totalIngredientsCount} ingrédients en stock
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-yellow-400 font-bold text-sm block">
                    {formatKamas(theoreticalDetail.cashToSpend)}
                  </span>
                  <span className="text-[10px] text-slate-400">à dépenser en HDV</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#232730]">
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#1c2029]"
              >
                Fermer
              </button>

              {selectedItemDetail.category === 'equipment' && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectForCraft(selectedItemDetail)
                    setSelectedItemDetail(null)
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-950 flex items-center gap-1.5"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>Ouvrir dans l'Atelier</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
