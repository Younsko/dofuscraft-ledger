import React, { useState, useEffect } from 'react'
import {
  Hammer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  Layers,
  ChevronDown,
  Search,
  PackageX,
  Coins,
  ArrowRight
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { DofusItem, StockItem, DofusRecipeIngredient } from '../types'
import { formatKamas, formatKamasCompact, calculateCraftRequirements } from '../utils/formatters'
import { searchDofusItems, fetchItemById, enrichRecipeIngredients, getPreloadedCatalog } from '../services/dofusApi'

interface CraftWorkshopProps {
  selectedItem: DofusItem | null
  stockItems: StockItem[]
  referencePrices: Record<number, number>
  onSelectItem: (item: DofusItem) => void
  onExecuteCraft: (item: DofusItem, qty: number) => Promise<{ success: boolean; craftRecord?: any; error?: string }>
  onOpenHDVWithItem: (item: DofusItem, missingQty?: number) => void
  onUpdateRefPrice: (ankama_id: number, price: number) => void
}

export const CraftWorkshop: React.FC<CraftWorkshopProps> = ({
  selectedItem,
  stockItems,
  referencePrices,
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

      let recipe = activeItem.recipe
      if (!recipe || recipe.length === 0) {
        const fullItem = await fetchItemById(activeItem.ankama_id, activeItem.category || 'equipment')
        if (fullItem?.recipe) recipe = fullItem.recipe
      }

      if (recipe && recipe.length > 0) {
        const enriched = await enrichRecipeIngredients(recipe)
        if (active) {
          setEnrichedRecipe(enriched)
          setIsLoadingRecipe(false)
        }
      } else {
        if (active) {
          setEnrichedRecipe([])
          setIsLoadingRecipe(false)
        }
      }
    }

    load()
    return () => { active = false }
  }, [activeItem])

  // Sync reference sale price
  useEffect(() => {
    if (activeItem) {
      const ref = referencePrices[activeItem.ankama_id] || 0
      setCustomSalePrice(ref)
    }
  }, [activeItem, referencePrices])

  // Item picker search
  useEffect(() => {
    let active = true
    const search = async () => {
      const results = await searchDofusItems(pickerSearch, 'equipment')
      if (active) setPickerResults(results)
    }
    const timer = setTimeout(search, 150)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [pickerSearch])

  // Calculate dynamic requirements
  const {
    requirements,
    isFullySatisfied,
    totalProjectedCost,
    totalStockCost,
    totalMissingCost
  } = calculateCraftRequirements(enrichedRecipe, craftQty, stockItems, referencePrices)

  const unitManufacturingCost = craftQty > 0 ? Math.round(totalProjectedCost / craftQty) : 0
  const projectedTotalRevenue = craftQty * customSalePrice
  const projectedNetRevenue = projectedTotalRevenue * 0.98 // 2% tax
  const projectedNetProfit = projectedNetRevenue - totalProjectedCost
  const projectedROI = totalProjectedCost > 0 ? ((projectedNetProfit / totalProjectedCost) * 100) : 0

  const handleCraft = async () => {
    if (!activeItem || craftQty <= 0) return
    setIsCrafting(true)

    const res = await onExecuteCraft(activeItem, craftQty)
    setIsCrafting(false)

    if (res.success && res.craftRecord) {
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
      {/* Product Hero Header (Vinted / YouTube Style) */}
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
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#21262d] text-yellow-400 text-xs font-bold rounded">
                  Niveau {activeItem?.level || 1}
                </span>
                <span className="text-xs text-slate-400">{activeItem?.type?.name || 'Équipement'}</span>
              </div>
              <h1 className="text-xl font-black text-white truncate mt-0.5">
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

        {/* Dropdown Item Search Selector */}
        {showPicker && (
          <div className="mt-4 pt-4 border-t border-[#30363d] space-y-3 animate-in slide-in-from-top-1">
            <input
              type="text"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Rechercher une arme, cape, chapeau... (ex: Voile, Gelano...)"
              className="w-full px-3.5 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-yellow-500"
              autoFocus
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {pickerResults.map((item) => (
                <button
                  key={item.ankama_id}
                  onClick={() => {
                    setActiveItem(item)
                    onSelectItem(item)
                    setShowPicker(false)
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-left transition ${
                    activeItem?.ankama_id === item.ankama_id
                      ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300'
                      : 'bg-[#0d1117] border-[#30363d] hover:border-slate-500 text-slate-300'
                  }`}
                >
                  <img src={item.image_urls?.icon} alt={item.name} className="w-7 h-7 object-contain shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">Niv. {item.level}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Checklist & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Ingredients Matrix */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
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
              {requirements.map((req) => (
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
              ))}
            </div>
          )}
        </div>

        {/* Financial Calculation Column */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            Bilan Financier & Rentabilité
          </h2>

          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
            {/* PRU Box */}
            <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Prix de Revient Unitaire (PRU)
              </span>
              <div className="text-2xl font-black font-mono text-yellow-400 mt-0.5">
                {formatKamas(unitManufacturingCost)}
              </div>
              <span className="text-[10px] text-slate-500">
                Coût réel par unité fabriquée
              </span>
            </div>

            {/* Breakdown costs */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Stock réel consommé :</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {formatKamas(totalStockCost)}
                </span>
              </div>

              {totalMissingCost > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span className="text-rose-400">Ressources manquantes :</span>
                  <span className="font-mono text-rose-400 font-bold">
                    +{formatKamas(totalMissingCost)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#21262d] flex justify-between font-bold text-xs text-white">
                <span>Coût Total du Craft ({craftQty}x) :</span>
                <span className="font-mono text-yellow-400">
                  {formatKamas(totalProjectedCost)}
                </span>
              </div>
            </div>

            {/* Selling price input */}
            <div className="pt-2 border-t border-[#21262d] space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Prix de vente estimé HDV
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={customSalePrice || ''}
                  onChange={(e) => {
                    const p = parseInt(e.target.value) || 0
                    setCustomSalePrice(p)
                    if (activeItem) onUpdateRefPrice(activeItem.ankama_id, p)
                  }}
                  placeholder="Prix de revente en Kamas..."
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs font-mono text-white focus:border-yellow-500 outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-yellow-400">
                  K
                </span>
              </div>

              {customSalePrice > 0 && (
                <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Revenu net après taxe (2%) :</span>
                    <span className="font-mono text-slate-200">{formatKamas(projectedNetRevenue)}</span>
                  </div>
                  <div className="pt-1 border-t border-[#21262d] flex justify-between items-center font-bold">
                    <span className="text-slate-300">Bénéfice Net :</span>
                    <span className={`font-mono ${projectedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {projectedNetProfit >= 0 ? '+' : ''}{formatKamas(projectedNetProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">ROI :</span>
                    <span className={`font-mono font-bold ${projectedROI >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {projectedROI >= 0 ? '+' : ''}{projectedROI.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Big Craft Button */}
            <button
              onClick={handleCraft}
              disabled={isCrafting || requirements.length === 0}
              className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 active:scale-98 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-md"
            >
              <Hammer className="w-4 h-4" />
              <span>
                {isCrafting
                  ? 'Fabrication...'
                  : isFullySatisfied
                  ? `Crafter ${craftQty}x ${activeItem?.name}`
                  : `Crafter ${craftQty}x (Déduire Stock)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Craft Receipt Modal */}
      {craftReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-yellow-400">
              <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Craft Réussi ! 🎉
                </h3>
                <p className="text-xs text-slate-400">
                  Les ressources ont été déduites de votre stock.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-2">
              <div className="flex items-center gap-3">
                <img src={craftReceipt.item_icon} alt={craftReceipt.item_name} className="w-10 h-10 object-contain" />
                <div>
                  <h4 className="font-bold text-white text-sm">
                    +{craftReceipt.quantity}x {craftReceipt.item_name}
                  </h4>
                  <p className="text-xs text-yellow-400 font-mono font-bold">
                    PRU de fabrication : {formatKamas(craftReceipt.unit_craft_cost)} / u
                  </p>
                </div>
              </div>
              <div className="pt-1.5 border-t border-[#21262d] flex justify-between text-xs text-slate-400">
                <span>Coût total :</span>
                <span className="font-mono text-white font-bold">{formatKamas(craftReceipt.total_craft_cost)}</span>
              </div>
            </div>

            <button
              onClick={() => setCraftReceipt(null)}
              className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              Fermer & Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
