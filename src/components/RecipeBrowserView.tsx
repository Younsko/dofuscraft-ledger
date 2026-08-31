import React, { useState, useEffect } from 'react'
import {
  Search,
  Hammer,
  PackagePlus,
  SlidersHorizontal,
  PackageCheck,
  PackageX,
  Layers,
  Sparkles,
  Info
} from 'lucide-react'
import { DofusItem, StockItem, DofusRecipeIngredient } from '../types'
import { searchDofusItems, fetchItemById, enrichRecipeIngredients } from '../services/dofusApi'
import { formatKamas } from '../utils/formatters'

interface RecipeBrowserViewProps {
  stockItems: StockItem[]
  referencePrices: Record<number, number>
  searchQuery: string
  onSelectForCraft: (item: DofusItem) => void
  onOpenHDVWithItem: (item: DofusItem) => void
  onUpdateRefPrice: (ankama_id: number, price: number) => void
}

export const RecipeBrowserView: React.FC<RecipeBrowserViewProps> = ({
  stockItems,
  referencePrices,
  searchQuery,
  onSelectForCraft,
  onOpenHDVWithItem,
  onUpdateRefPrice
}) => {
  const [category, setCategory] = useState<string>('all')
  const [minLevel, setMinLevel] = useState<number>(1)
  const [maxLevel, setMaxLevel] = useState<number>(200)
  const [results, setResults] = useState<DofusItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItemDetail, setSelectedItemDetail] = useState<DofusItem | null>(null)
  const [detailedRecipe, setDetailedRecipe] = useState<DofusRecipeIngredient[]>([])
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false)

  // Map of stock quantities
  const stockMap = new Map<number, StockItem>()
  stockItems.forEach(it => stockMap.set(it.item_ankama_id, it))

  useEffect(() => {
    let active = true
    const loadItems = async () => {
      setIsLoading(true)
      const cat = category === 'all' ? undefined : category
      const items = await searchDofusItems(searchQuery, cat)

      if (active) {
        const filtered = items.filter(
          it => it.level >= minLevel && it.level <= maxLevel
        )
        setResults(filtered)
        setIsLoading(false)
      }
    }

    const timer = setTimeout(loadItems, 150)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery, category, minLevel, maxLevel])

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

  const categories = [
    { id: 'all', label: 'Tout le Catalogue' },
    { id: 'equipment', label: '⚔️ Équipements' },
    { id: 'runes', label: '🔮 Runes FM & Trans' },
    { id: 'resources', label: '🌿 Ressources' },
    { id: 'consumables', label: '🧪 Consommables' }
  ]

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Category Chips & Filter Bar (YouTube / Vinted style) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#161b22] p-3 rounded-2xl border border-[#30363d]">
        {/* Category pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-full font-semibold transition whitespace-nowrap text-xs ${
                category === c.id
                  ? 'bg-yellow-400 text-slate-950 font-bold shadow-sm'
                  : 'bg-[#21262d] text-slate-300 hover:text-white hover:bg-[#30363d]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Level Range Filter */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#0d1117] px-3 py-1.5 rounded-full border border-[#30363d] self-start sm:self-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>Niveau :</span>
          <input
            type="number"
            min="1"
            max="200"
            value={minLevel}
            onChange={(e) => setMinLevel(parseInt(e.target.value) || 1)}
            className="w-12 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center text-yellow-400 font-mono"
          />
          <span>à</span>
          <input
            type="number"
            min="1"
            max="200"
            value={maxLevel}
            onChange={(e) => setMaxLevel(parseInt(e.target.value) || 200)}
            className="w-12 px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center text-yellow-400 font-mono"
          />
        </div>
      </div>

      {/* Product Grid (Vinted Product Cards Layout) */}
      {isLoading ? (
        <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-16 text-center text-slate-400">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full mb-3" />
          <p className="text-xs">Chargement du catalogue Dofus 3...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-16 text-center text-slate-400 space-y-2">
          <PackageX className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-bold text-slate-200 text-sm">Aucun item trouvé.</p>
          <p className="text-xs text-slate-500">Essayez une autre recherche dans la barre supérieure.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {results.map((item) => {
            const stock = stockMap.get(item.ankama_id)
            const refPrice = referencePrices[item.ankama_id] || (stock ? stock.pru : null)

            return (
              <div
                key={item.ankama_id}
                className="vinted-card rounded-xl overflow-hidden flex flex-col justify-between group cursor-pointer"
                onClick={() => handleInspect(item)}
              >
                {/* Product Image Box */}
                <div className="vinted-img-box h-32 relative flex items-center justify-center p-3 border-b border-[#21262d]">
                  <img
                    src={item.image_urls?.icon}
                    alt={item.name}
                    className="w-16 h-16 object-contain group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                    }}
                  />

                  {/* Level Pill */}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#0d1117]/80 text-yellow-400 border border-[#30363d] text-[10px] font-mono font-bold rounded">
                    Niv. {item.level}
                  </span>

                  {/* Stock Pill */}
                  {stock && stock.total_quantity > 0 ? (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold rounded flex items-center gap-0.5">
                      <PackageCheck className="w-3 h-3" />
                      {stock.total_quantity}
                    </span>
                  ) : null}
                </div>

                {/* Product Content (Vinted style) */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    {/* Price Tag */}
                    <div className="font-mono font-extrabold text-sm text-yellow-400">
                      {refPrice ? formatKamas(refPrice) : 'Prix HDV ?'}
                    </div>

                    {/* Item Name */}
                    <h3 className="font-bold text-slate-100 text-xs line-clamp-1 mt-0.5 group-hover:text-yellow-400 transition">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.type?.name || 'Item'}
                    </p>
                  </div>

                  {/* Card Quick Action Bar */}
                  <div className="flex items-center gap-1 pt-1.5 border-t border-[#21262d]" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectForCraft(item)}
                      className="flex-1 py-1.5 bg-[#21262d] hover:bg-yellow-500 hover:text-slate-950 text-slate-200 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1"
                      title="Ouvrir dans l'Atelier de Craft"
                    >
                      <Hammer className="w-3 h-3" />
                      <span>Craft</span>
                    </button>

                    <button
                      onClick={() => onOpenHDVWithItem(item)}
                      className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white rounded-lg transition"
                      title="Indexer un Achat HDV"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Product Detail Modal (Vinted Style Drawer/Modal) */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 bg-[#0d1117] rounded-xl border border-[#30363d] p-2 flex items-center justify-center">
                  <img
                    src={selectedItemDetail.image_urls?.icon}
                    alt={selectedItemDetail.name}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 bg-yellow-400 text-slate-950 font-bold rounded">
                      {selectedItemDetail.type?.name}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Niveau {selectedItemDetail.level}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {selectedItemDetail.name}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedItemDetail(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {selectedItemDetail.description && (
              <p className="text-xs text-slate-300 bg-[#0d1117] p-3 rounded-xl border border-[#30363d]">
                {selectedItemDetail.description}
              </p>
            )}

            {/* Recipe Ingredients Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-yellow-400" />
                Ingrédients requis pour fabriquer 1x :
              </h4>

              {isLoadingRecipe ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Chargement de la recette...
                </div>
              ) : detailedRecipe.length === 0 ? (
                <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d] text-center text-xs text-slate-500">
                  Cet item ne possède pas de recette (ressource brute ou drop).
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {detailedRecipe.map((ing) => {
                    const ingStock = stockMap.get(ing.item_ankama_id)
                    const hasQty = ingStock ? ingStock.total_quantity : 0

                    return (
                      <div
                        key={ing.item_ankama_id}
                        className="p-2 bg-[#0d1117] rounded-xl border border-[#30363d] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={ing.item_icon}
                            alt={ing.item_name}
                            className="w-6 h-6 object-contain"
                          />
                          <span className="text-slate-200 font-medium">{ing.item_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">
                            Requis : <strong className="text-yellow-400">{ing.quantity}</strong>
                          </span>
                          <span className={`font-mono text-[11px] ${hasQty >= ing.quantity ? 'text-emerald-400' : 'text-rose-400'}`}>
                            (Stock: {hasQty})
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-[#30363d]">
              <button
                onClick={() => {
                  onSelectForCraft(selectedItemDetail)
                  setSelectedItemDetail(null)
                }}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Hammer className="w-4 h-4" />
                <span>Simuler dans l'Atelier</span>
              </button>

              <button
                onClick={() => {
                  onOpenHDVWithItem(selectedItemDetail)
                  setSelectedItemDetail(null)
                }}
                className="px-4 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-slate-200 font-semibold rounded-xl text-xs transition"
              >
                + Achat HDV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
