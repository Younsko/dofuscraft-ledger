import React, { useState, useEffect } from 'react'
import {
  Hammer,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  Layers,
  ChevronDown,
  Search,
  PackageX,
  Coins,
  ArrowRight,
  Zap,
  Info,
  TrendingUp,
  Check
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { DofusItem, StockItem, DofusRecipeIngredient, CrushRecord } from '../types'
import {
  formatKamas,
  formatKamasCompact,
  calculateCraftRequirements,
  estimateCraftCostFromPastPurchases,
  formatDate
} from '../utils/formatters'
import { searchDofusItems, fetchItemById, enrichRecipeIngredients, getPreloadedCatalog } from '../services/dofusApi'

interface CraftWorkshopProps {
  selectedItem: DofusItem | null
  stockItems: StockItem[]
  referencePrices: Record<number, number>
  latestKnownPrices?: Record<number, { price: number; date?: string }>
  latestCrushesByItem?: Record<number, CrushRecord>
  onSelectItem: (item: DofusItem) => void
  onExecuteCraft: (item: DofusItem, qty: number, recipe?: any[]) => any
  onOpenHDVWithItem: (item: DofusItem, missingQty?: number) => void
  onUpdateRefPrice: (ankama_id: number, price: number) => void
}

export const CraftWorkshop: React.FC<CraftWorkshopProps> = ({
  selectedItem,
  stockItems,
  referencePrices,
  latestKnownPrices = {},
  latestCrushesByItem = {},
  onSelectItem,
  onExecuteCraft,
  onOpenHDVWithItem,
  onUpdateRefPrice
}) => {
  const [craftQty, setCraftQty] = useState<number>(1)
  const [activeItem, setActiveItem] = useState<DofusItem | null>(selectedItem)
  const [enrichedRecipe, setEnrichedRecipe] = useState<DofusRecipeIngredient[]>([])
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerResults, setPickerResults] = useState<DofusItem[]>([])
  const [customSalePrice, setCustomSalePrice] = useState<number>(0)
  const [isCrafting, setIsCrafting] = useState(false)
  const [craftReceipt, setCraftReceipt] = useState<any | null>(null)
  const [showEstimationDetails, setShowEstimationDetails] = useState(false)

  // Initialize with selectedItem or fetch first craftable item from real catalog
  useEffect(() => {
    if (selectedItem) {
      setActiveItem(selectedItem)
    } else if (!activeItem) {
      getPreloadedCatalog('equipment').then((items: DofusItem[]) => {
        const firstCraftable = items.find((it: DofusItem) => it.category === 'equipment') || items[0]
        if (firstCraftable) setActiveItem(firstCraftable)
      })
    }
  }, [selectedItem])

  // Load recipe when activeItem changes
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!activeItem) return
      setIsLoadingRecipe(true)

      let fullItem = activeItem
      if (!fullItem.recipe || fullItem.recipe.length === 0) {
        const fetched = await fetchItemById(activeItem.ankama_id, activeItem.category || 'equipment')
        if (fetched && fetched.recipe) {
          fullItem = fetched
        }
      }

      if (fullItem.recipe && fullItem.recipe.length > 0) {
        const enriched = await enrichRecipeIngredients(fullItem.recipe)
        if (active) setEnrichedRecipe(enriched)
      } else {
        if (active) setEnrichedRecipe([])
      }

      if (active) {
        setIsLoadingRecipe(false)
        setCustomSalePrice(referencePrices[activeItem.ankama_id] || (activeItem.level * 2500) || 50000)
        setCraftReceipt(null)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [activeItem])

  // Search picker autocomplete
  useEffect(() => {
    if (!pickerSearch.trim()) {
      getPreloadedCatalog('equipment').then(items => setPickerResults(items.slice(0, 15)))
      return
    }

    const timer = setTimeout(async () => {
      const results = await searchDofusItems(pickerSearch, 'equipment')
      setPickerResults(results)
    }, 150)

    return () => clearTimeout(timer)
  }, [pickerSearch])

  // Real-time craft calculation
  const {
    requirements,
    isFullySatisfied,
    totalProjectedCost,
    totalStockCost,
    totalMissingCost
  } = calculateCraftRequirements(enrichedRecipe, craftQty, stockItems, referencePrices)

  // Estimated craft cost based on latest known purchase prices
  const estimatedCraft = estimateCraftCostFromPastPurchases(
    enrichedRecipe,
    latestKnownPrices,
    craftQty
  )

  const unitManufacturingCost = craftQty > 0 ? Math.round(totalProjectedCost / craftQty) : 0
  const projectedTotalRevenue = craftQty * customSalePrice
  const projectedNetRevenue = projectedTotalRevenue * 0.98 // 2% tax
  const projectedNetProfit = projectedNetRevenue - totalProjectedCost
  const projectedROI = totalProjectedCost > 0 ? ((projectedNetProfit / totalProjectedCost) * 100) : 0

  const handleCraft = async () => {
    if (!activeItem || craftQty <= 0) return
    setIsCrafting(true)

    const res = await onExecuteCraft(activeItem, craftQty, enrichedRecipe)
    setIsCrafting(false)

    if (res && res.craftRecord) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#eab308', '#facc15', '#fef08a']
        })
      } catch (e) {
        console.error(e)
      }

      setCraftReceipt(res.craftRecord)
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Product Hero Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Item Info */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-16 h-16 bg-[#0d1117] rounded-xl border border-[#30363d] p-1.5 flex items-center justify-center shrink-0">
              <img
                src={activeItem?.image_urls?.icon}
                alt={activeItem?.name}
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                }}
              />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-[#21262d] text-yellow-400 text-xs font-bold rounded">
                  Niveau {activeItem?.level || 1}
                </span>
                <span className="text-xs text-slate-400">{activeItem?.type?.name || 'Équipement'}</span>

                {/* Estimation Badge based on latest purchase prices */}
                {estimatedCraft.totalEstimatedCost > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowEstimationDetails(!showEstimationDetails)}
                    className="px-2.5 py-0.5 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 rounded-full flex items-center gap-1.5 transition text-xs cursor-pointer"
                    title="Cliquer pour voir le détail de l'estimation basée sur vos derniers achats"
                  >
                    <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-slate-300 font-medium">Prix Estimé :</span>
                    <strong className="text-yellow-400 font-mono font-bold">
                      {formatKamas(estimatedCraft.totalEstimatedCost)}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({estimatedCraft.knownIngredientsCount}/{estimatedCraft.totalIngredientsCount} prix)
                    </span>
                  </button>
                )}

                {/* Last Crush Output Badge */}
                {activeItem && latestCrushesByItem[activeItem.ankama_id] && (
                  <div className="px-2.5 py-0.5 bg-purple-950/60 border border-purple-800 rounded-full flex items-center gap-1.5 text-xs text-purple-300">
                    <Hammer className="w-3 h-3 text-purple-400" />
                    <span>Dernier brisage :</span>
                    <strong className="text-white">
                      {latestCrushesByItem[activeItem.ankama_id].runes_obtained.map(r => `${r.quantity}x ${r.rune_name}`).join(', ')}
                    </strong>
                    <span>({formatKamas(latestCrushesByItem[activeItem.ankama_id].total_runes_value)})</span>
                    {latestCrushesByItem[activeItem.ankama_id].coefficient_percent && (
                      <span className="text-yellow-400 font-mono font-bold">• {latestCrushesByItem[activeItem.ankama_id].coefficient_percent}%</span>
                    )}
                  </div>
                )}
              </div>

              <h1 className="text-xl font-black text-white truncate mt-1">
                {activeItem?.name || 'Sélectionner un Item'}
              </h1>
              <p className="text-xs text-slate-400 truncate max-w-xl">
                {activeItem?.description || 'Calculez le coût exact et déduisez les stocks.'}
              </p>
            </div>
          </div>

          {/* Multiplier & Change Button */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d] text-xs">
              <span className="text-slate-400 font-semibold px-2">Quantité :</span>
              {[1, 5, 10, 20, 50].map((q) => (
                <button
                  key={q}
                  onClick={() => setCraftQty(q)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition ${
                    craftQty === q
                      ? 'bg-yellow-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  x{q}
                </button>
              ))}
              <input
                type="number"
                min="1"
                value={craftQty}
                onChange={(e) => setCraftQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 px-1.5 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-center font-mono text-yellow-400 outline-none"
              />
            </div>

            <button
              onClick={() => setShowPicker(!showPicker)}
              className="px-3.5 py-2 bg-[#21262d] hover:bg-[#30363d] text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Changer d'item</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Estimation Details Accordion */}
        {showEstimationDetails && estimatedCraft.ingredients.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#30363d] bg-[#0d1117] p-3.5 rounded-xl space-y-2 animate-in slide-in-from-top-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-yellow-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Détail de l'estimation basée sur vos derniers prix d'achats :
              </span>
              <span className="text-[10px] text-slate-500">
                (Ne pas se fier à 100%, indicatif selon vos dates d'achats)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {estimatedCraft.ingredients.map(ing => (
                <div key={ing.item_ankama_id} className="p-2 bg-[#161b22] border border-[#30363d] rounded-lg text-xs flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">{ing.item_name}</span>
                    <span className="text-[10px] text-slate-400">{ing.quantity} u</span>
                  </div>
                  <div className="text-right shrink-0">
                    {ing.hasKnownPrice ? (
                      <>
                        <span className="font-mono text-yellow-400 font-bold block">{formatKamas(ing.unitPrice)} / u</span>
                        <span className="text-[9px] text-slate-500">{ing.date ? formatDate(ing.date) : 'Prix réf'}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Prix inconnu</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropdown Item Search Selector */}
        {showPicker && (
          <div className="mt-4 pt-4 border-t border-[#30363d] space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Rechercher parmi tous les items craftables (ex: Voile d'Encre, Gelano, Dofus)..."
                className="w-full pl-9 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-yellow-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
              {pickerResults.map((item) => (
                <button
                  key={item.ankama_id}
                  onClick={() => {
                    setActiveItem(item)
                    onSelectItem(item)
                    setShowPicker(false)
                  }}
                  className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                    activeItem?.ankama_id === item.ankama_id
                      ? 'bg-yellow-500/10 border-yellow-500'
                      : 'bg-[#0d1117] border-[#30363d] hover:border-slate-500 hover:bg-[#21262d]'
                  }`}
                >
                  <img
                    src={item.image_urls?.icon}
                    alt={item.name}
                    className="w-8 h-8 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                    }}
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">Niv. {item.level}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Two Columns: Recipe Checklist & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Recipe Requirements Matrix */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-yellow-400" />
              Ingrédients Requis ({craftQty}x)
            </h2>

            {isFullySatisfied ? (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                100% en Stock
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Ressources Manquantes
              </span>
            )}
          </div>

          {isLoadingRecipe ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-12 text-center text-slate-400 text-xs">
              Chargement de la recette...
            </div>
          ) : requirements.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-12 text-center text-slate-400 text-xs space-y-1">
              <p className="font-bold text-slate-300">Aucune recette associée à cet item.</p>
              <p className="text-slate-500">Choisissez un équipement ou consommable craftable.</p>
            </div>
          ) : (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl divide-y divide-[#21262d] overflow-hidden">
              {requirements.map((req) => {
                const latest = latestKnownPrices[req.item_ankama_id]

                return (
                  <div
                    key={req.item_ankama_id}
                    className={`p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      !req.is_satisfied
                        ? 'bg-rose-950/20 border-l-4 border-rose-500'
                        : 'hover:bg-[#21262d]/40 border-l-4 border-emerald-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-[#0d1117] rounded-xl border border-[#30363d] p-1 flex items-center justify-center shrink-0">
                        <img
                          src={req.icon}
                          alt={req.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                          }}
                        />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{req.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Requis : <strong className="text-yellow-400">{req.required_qty}</strong></span>
                          <span>•</span>
                          <span className={req.available_qty >= req.required_qty ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            En stock : {req.available_qty}
                          </span>
                        </div>
                        {latest && latest.price > 0 && (
                          <span className="text-[10px] text-slate-500 block">
                            Dernier achat : {formatKamas(latest.price)}/u {latest.date ? `(${formatDate(latest.date)})` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      {req.is_satisfied ? (
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            Dispo
                          </span>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            PRU: {formatKamas(req.stock_pru)}/u
                          </p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-xs font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                            Manque : -{req.missing_qty}
                          </span>
                          <p className="text-[10px] text-rose-400 font-mono mt-0.5">
                            Est. {formatKamas(req.missing_cost_estimated)}
                          </p>
                        </div>
                      )}

                      {!req.is_satisfied && (
                        <button
                          onClick={() =>
                            onOpenHDVWithItem(
                              {
                                ankama_id: req.item_ankama_id,
                                name: req.name,
                                type: { id: 0, name: req.type },
                                level: 1,
                                image_urls: { icon: req.icon },
                                category: 'resources'
                              },
                              req.missing_qty
                            )
                          }
                          className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0"
                          title="Acheter les ressources manquantes sur l'HDV"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Acheter +{req.missing_qty}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): PRU, Cost Breakdown & Craft Execution */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-400" />
              Bilan Financier du Craft ({craftQty}x)
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#21262d]">
                <span className="text-slate-400">Coût issu du Stock existant :</span>
                <span className="font-mono text-emerald-400 font-bold">{formatKamas(totalStockCost)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#21262d]">
                <span className="text-slate-400">Achats restants à prévoir (HDV) :</span>
                <span className={`font-mono font-bold ${totalMissingCost > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {formatKamas(totalMissingCost)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#21262d] bg-[#0d1117] px-3 rounded-xl">
                <span className="font-bold text-white">Coût Total de Production :</span>
                <span className="font-mono text-yellow-400 font-bold text-sm">
                  {formatKamas(totalProjectedCost)}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Prix de Revient Unitaire (PRU) :</span>
                <span className="font-mono text-yellow-400 font-bold">
                  {formatKamas(unitManufacturingCost)} / u
                </span>
              </div>
            </div>

            {/* Simulated Resale ROI */}
            <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Prix de Vente HDV simulé :</span>
                <div className="relative w-32">
                  <input
                    type="number"
                    value={customSalePrice}
                    onChange={(e) => setCustomSalePrice(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-[#161b22] border border-[#30363d] rounded text-right font-mono text-yellow-400 text-xs outline-none focus:border-yellow-500"
                  />
                  <span className="absolute right-1 top-1 text-[10px] text-slate-500 pointer-events-none"></span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#21262d]">
                <span className="text-slate-400">Bénéfice Net Projeté :</span>
                <span className={`font-mono font-bold ${projectedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {projectedNetProfit >= 0 ? '+' : ''}{formatKamas(projectedNetProfit)} ({projectedROI.toFixed(1)}% ROI)
                </span>
              </div>
            </div>

            {/* Execute Craft Button */}
            <button
              onClick={handleCraft}
              disabled={isCrafting || requirements.length === 0}
              className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                isFullySatisfied
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950'
                  : 'bg-yellow-500/80 hover:bg-yellow-500 text-slate-950'
              }`}
            >
              <Hammer className="w-4 h-4" />
              <span>
                {isFullySatisfied
                  ? `Crafter ${craftQty}x ${activeItem?.name} (Déduire Stock)`
                  : `Crafter ${craftQty}x (${requirements.filter(r => !r.is_satisfied).length} ingr. manquants)`}
              </span>
            </button>
          </div>

          {/* Craft Receipt Confirmation */}
          {craftReceipt && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500 text-emerald-200 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Craft réussi ! {craftQty}x {activeItem?.name} ajoutés à l'inventaire</span>
              </div>
              <p className="text-[11px] text-emerald-300/80">
                PRU final calculé : <strong className="text-yellow-400 font-mono">{formatKamas(craftReceipt.unit_craft_cost || craftReceipt.unit_pru)} / u</strong>.
                Les ingrédients ont été déduits de votre coffre selon la méthode FIFO.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
