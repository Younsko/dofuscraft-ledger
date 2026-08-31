import React, { useState, useEffect } from 'react'
import {
  Search,
  Hammer,
  PackagePlus,
  SlidersHorizontal,
  PackageCheck,
  PackageX,
  Layers,
  Info,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Coins
} from 'lucide-react'
import { DofusItem, StockItem, DofusRecipeIngredient } from '../types'
import { searchDofusItems, fetchItemById, enrichRecipeIngredients } from '../services/dofusApi'
import { formatKamas, calculateTheoreticalCraftCost, formatDate } from '../utils/formatters'

interface RecipeBrowserViewProps {
  stockItems: StockItem[]
  referencePrices: Record<number, number>
  latestKnownPrices?: Record<number, { price: number; date?: string }>
  searchQuery: string
  onSelectForCraft: (item: DofusItem) => void
  onOpenHDVWithItem: (item: DofusItem) => void
  onUpdateRefPrice: (ankama_id: number, price: number) => void
}

export const RecipeBrowserView: React.FC<RecipeBrowserViewProps> = ({
  stockItems,
  referencePrices,
  latestKnownPrices = {},
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

  const theoreticalDetail = selectedItemDetail && detailedRecipe.length > 0
    ? calculateTheoreticalCraftCost(detailedRecipe, stockMap, latestKnownPrices)
    : null

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Category Chips & Filter Bar (YouTube / Vinted style) */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3">
        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition ${
                category === c.id
                  ? 'bg-yellow-400 text-slate-950 font-black shadow-xs'
                  : 'bg-[#0d1117] text-slate-300 hover:text-white border border-[#30363d]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Level Range Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#21262d] text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-yellow-400" />
            <span>Filtre Niveau :</span>
            <span className="font-mono text-yellow-400 font-bold">{minLevel} - {maxLevel}</span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              type="range"
              min="1"
              max="200"
              value={maxLevel}
              onChange={(e) => setMaxLevel(parseInt(e.target.value) || 200)}
              className="w-full accent-yellow-400 cursor-pointer h-1.5 bg-[#21262d] rounded-lg"
            />
          </div>

          <div className="flex gap-1 text-[11px]">
            {[
              { label: 'Tous (1-200)', min: 1, max: 200 },
              { label: '1-50', min: 1, max: 50 },
              { label: '51-120', min: 51, max: 120 },
              { label: '121-199', min: 121, max: 199 },
              { label: '200 (THL)', min: 200, max: 200 }
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setMinLevel(p.min)
                  setMaxLevel(p.max)
                }}
                className={`px-2 py-1 rounded border transition ${
                  minLevel === p.min && maxLevel === p.max
                    ? 'bg-yellow-400 text-slate-950 font-bold border-yellow-400'
                    : 'bg-[#0d1117] text-slate-400 hover:text-white border-[#30363d]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Results Feed */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Chargement du catalogue Dofus 3...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-16 text-center text-slate-400 space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-bold text-slate-200 text-sm">Aucun item trouvé.</p>
          <p className="text-xs text-slate-500">Essayez un autre mot-clé ou élargissez la tranche de niveau.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {results.map((item) => {
            const stock = stockMap.get(item.ankama_id)
            const refPrice = referencePrices[item.ankama_id] || (stock ? stock.pru : null)
            const theoretical = item.recipe && item.recipe.length > 0
              ? calculateTheoreticalCraftCost(item.recipe, stockMap, latestKnownPrices)
              : null

            return (
              <div
                key={item.ankama_id}
                onClick={() => handleInspect(item)}
                className="vinted-card rounded-2xl overflow-hidden cursor-pointer flex flex-col group active:scale-98"
              >
                {/* Product Image Frame */}
                <div className="vinted-img-box aspect-square relative flex items-center justify-center p-3 border-b border-[#21262d] overflow-hidden">
                  <img
                    src={item.image_urls?.icon}
                    alt={item.name}
                    className="w-16 h-16 object-contain group-hover:scale-110 transition duration-200 drop-shadow-md"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                    }}
                  />

                  {/* Level Pill */}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#0d1117]/90 backdrop-blur-xs text-yellow-400 border border-[#30363d] text-[10px] font-mono font-bold rounded">
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

                {/* Product Content */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    {/* Item Name */}
                    <h3 className="font-bold text-slate-100 text-xs line-clamp-1 group-hover:text-yellow-400 transition">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.type?.name || 'Item'}
                    </p>

                    {/* Dynamic Theoretical Craft Price according to user's stock & past prices */}
                    {theoretical && (theoretical.totalTheoreticalCost > 0 || theoretical.inStockIngredientsCount > 0) ? (
                      <div className="mt-1.5 space-y-0.5">
                        {theoretical.isFullyInStock ? (
                          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                            <span>✨ 100% en Banque (0 K)</span>
                          </div>
                        ) : theoretical.inStockIngredientsCount > 0 ? (
                          <>
                            <div className="font-mono text-xs font-bold text-emerald-400 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-sans">À payer HDV :</span>
                              <span>{formatKamas(theoretical.cashToSpend)}</span>
                            </div>
                            <div className="text-[9px] text-slate-400 flex items-center justify-between">
                              <span>Coût Total : {formatKamas(theoretical.totalTheoreticalCost)}</span>
                              <span className="text-emerald-400 font-bold">({theoretical.inStockIngredientsCount}/{theoretical.totalIngredientsCount} coffre)</span>
                            </div>
                          </>
                        ) : (
                          <div className="font-mono text-xs font-bold text-yellow-400 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-sans">Coût Craft :</span>
                            <span>{formatKamas(theoretical.totalTheoreticalCost)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fallback to HDV price if known */
                      <div className="font-mono font-extrabold text-xs text-yellow-400 mt-1">
                        {refPrice ? formatKamas(refPrice) : 'Prix HDV ?'}
                      </div>
                    )}
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

      {/* Product Detail Modal */}
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

            {/* Dynamic Theoretical Craft Cost Card according to user bank & prices */}
            {theoreticalDetail && (
              <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                  <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Coût Théorique selon vos données :
                  </span>
                  <span className="font-mono text-sm font-black text-yellow-400">
                    {formatKamas(theoreticalDetail.totalTheoreticalCost)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-[#161b22] rounded-lg border border-[#30363d]">
                    <span className="text-[10px] text-slate-400 block font-semibold">🛒 Reste à payer HDV</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {formatKamas(theoreticalDetail.cashToSpend)}
                    </span>
                  </div>
                  <div className="p-2 bg-[#161b22] rounded-lg border border-[#30363d]">
                    <span className="text-[10px] text-slate-400 block font-semibold">📦 Ressources en banque</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {theoreticalDetail.inStockIngredientsCount}/{theoreticalDetail.totalIngredientsCount} ingrédients
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  Calculé avec vos stocks réels (déduits à 0 K à débourser) et vos derniers prix connus ({theoreticalDetail.knownPricesCount}/{theoreticalDetail.totalIngredientsCount} prix).
                  {theoreticalDetail.unknownPricesCount > 0 && (
                    <span className="text-amber-400 ml-1">
                      • {theoreticalDetail.unknownPricesCount} ressource(s) non indexée(s) comptée(s) à 0 K.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Recipe Ingredients Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-yellow-400" />
                Détail de la Recette ({detailedRecipe.length} ingrédients) :
              </h4>

              {isLoadingRecipe ? (
                <p className="text-xs text-slate-500 py-3">Chargement de la recette...</p>
              ) : detailedRecipe.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">Aucune recette pour cet item.</p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {theoreticalDetail?.ingredients.map((ing) => (
                    <div
                      key={ing.item_ankama_id}
                      className="p-2 bg-[#0d1117] rounded-xl border border-[#30363d] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={ing.item_icon}
                          alt={ing.item_name}
                          className="w-6 h-6 object-contain shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-semibold text-slate-200 truncate block">
                            {ing.item_name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {ing.in_stock_qty > 0 ? (
                              <strong className="text-emerald-400">
                                📦 {ing.in_stock_qty}/{ing.required_qty} en banque
                              </strong>
                            ) : (
                              <span className="text-slate-500">Pas en banque</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-white font-bold block">
                          x{ing.required_qty}
                        </span>
                        {ing.missing_qty > 0 ? (
                          ing.has_known_price ? (
                            <span className="text-[9px] text-yellow-400 font-mono">
                              Manque {ing.missing_qty} • {formatKamas(ing.cost_to_buy)}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-mono">
                              Prix non indexé (0 K)
                            </span>
                          )
                        ) : (
                          <span className="text-[9px] text-emerald-400 font-bold">
                            ✅ 100% en stock
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#30363d]">
              <button
                onClick={() => {
                  onSelectForCraft(selectedItemDetail)
                  setSelectedItemDetail(null)
                }}
                className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Hammer className="w-4 h-4" />
                <span>Ouvrir dans l'Atelier de Craft</span>
              </button>

              <button
                onClick={() => {
                  onOpenHDVWithItem(selectedItemDetail)
                  setSelectedItemDetail(null)
                }}
                className="px-4 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>Acheter HDV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
