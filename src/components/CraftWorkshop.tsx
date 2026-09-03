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
  Check,
  Plus,
  Tag,
  PackagePlus
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { DofusItem, StockItem, DofusRecipeIngredient, CrushRecord, PurchaseBatch } from '../types'
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
  onAddSingleBatch?: (batch: Omit<PurchaseBatch, 'id' | 'remaining_quantity'>) => void
  onAddMultipleBatches?: (batches: Array<Omit<PurchaseBatch, 'id' | 'remaining_quantity'>>) => void
  onUpdateRefPrice: (ankama_id: number, price: number) => void
  onUpdateMultipleRefPrices?: (prices: Array<{ itemAnkamaId: number; price: number }>) => void
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
  onAddSingleBatch,
  onAddMultipleBatches,
  onUpdateRefPrice,
  onUpdateMultipleRefPrices
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

  // Inline Quick Input State per ingredient: { price: string, qty: string }
  const [inlineInputs, setInlineInputs] = useState<Record<number, { price: string; qty: string }>>({})
  const [quickToast, setQuickToast] = useState<string | null>(null)

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
        const existingPrice = referencePrices[activeItem.ankama_id] || latestKnownPrices[activeItem.ankama_id]?.price || 0
        setCustomSalePrice(existingPrice)
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

  // Recipe Requirements & Stock Deductions
  const {
    requirements,
    isFullySatisfied,
    totalStockCost,
    totalMissingCost,
    totalProjectedCost
  } = calculateCraftRequirements(
    enrichedRecipe,
    craftQty,
    stockItems,
    referencePrices
  )

  // Sync / Initialize inline inputs when requirements or craftQty changes
  useEffect(() => {
    setInlineInputs(prev => {
      const updated = { ...prev }
      requirements.forEach(req => {
        const defaultQty = req.missing_qty > 0 ? req.missing_qty.toString() : req.required_qty.toString()
        const defaultPrice = latestKnownPrices[req.item_ankama_id]?.price?.toString() ||
                             referencePrices[req.item_ankama_id]?.toString() ||
                             ''

        if (!updated[req.item_ankama_id]) {
          updated[req.item_ankama_id] = { qty: defaultQty, price: defaultPrice }
        } else {
          // If user hasn't explicitly typed, keep updated missing qty
          if (!updated[req.item_ankama_id].qty || parseInt(updated[req.item_ankama_id].qty) <= 0) {
            updated[req.item_ankama_id].qty = defaultQty
          }
          if (!updated[req.item_ankama_id].price && defaultPrice) {
            updated[req.item_ankama_id].price = defaultPrice
          }
        }
      })
      return updated
    })
  }, [enrichedRecipe, craftQty, latestKnownPrices, referencePrices])

  const handleUpdateInlineRow = (ankamaId: number, field: 'price' | 'qty', value: string) => {
    setInlineInputs(prev => ({
      ...prev,
      [ankamaId]: {
        ...prev[ankamaId],
        [field]: value
      }
    }))
  }

  // 1-Click Inline Buy / Add to stock for a single ingredient
  const handleInlineBuyBatch = (req: any) => {
    const row = inlineInputs[req.item_ankama_id] || { price: '0', qty: req.missing_qty.toString() }
    const qty = parseInt(row.qty) || req.missing_qty || req.required_qty || 1
    const price = parseInt(row.price) || latestKnownPrices[req.item_ankama_id]?.price || referencePrices[req.item_ankama_id] || 0

    if (qty <= 0 || price <= 0) {
      if (price <= 0) {
        onOpenHDVWithItem(
          {
            ankama_id: req.item_ankama_id,
            name: req.name,
            type: { id: 0, name: req.type },
            level: 1,
            image_urls: { icon: req.icon },
            category: 'resources'
          },
          qty
        )
      }
      return
    }

    if (onAddSingleBatch) {
      onAddSingleBatch({
        item_ankama_id: req.item_ankama_id,
        item_name: req.name,
        item_type: req.type || 'Ressource',
        item_icon: req.icon,
        item_level: 1,
        category: 'resources',
        quantity: qty,
        unit_price: price,
        total_price: qty * price,
        date: new Date().toISOString(),
        note: `Achat rapide pour ${activeItem?.name || 'Craft'}`
      })

      setQuickToast(`+${qty}x ${req.name} ajoutés au stock !`)
      setTimeout(() => setQuickToast(null), 2500)
    }
  }

  // 1-Click Inline Index Price Only (without stock)
  const handleInlineIndexPrice = (req: any) => {
    const row = inlineInputs[req.item_ankama_id] || { price: '0', qty: '1' }
    const price = parseInt(row.price) || 0

    if (price > 0) {
      onUpdateRefPrice(req.item_ankama_id, price)
      setQuickToast(`Prix de ${req.name} indexé (${formatKamas(price)})`)
      setTimeout(() => setQuickToast(null), 2500)
    }
  }

  // Master 1-Click: Buy / Add all missing ingredients to stock simultaneously
  const handleBuyAllMissingInline = () => {
    const missingReqs = requirements.filter(r => !r.is_satisfied && r.missing_qty > 0)
    if (missingReqs.length === 0) return

    const batchesToAdd: Array<Omit<PurchaseBatch, 'id' | 'remaining_quantity'>> = []

    missingReqs.forEach(req => {
      const row = inlineInputs[req.item_ankama_id]
      const qty = parseInt(row?.qty || '') || req.missing_qty
      const price = parseInt(row?.price || '') || latestKnownPrices[req.item_ankama_id]?.price || referencePrices[req.item_ankama_id] || 0

      if (qty > 0 && price > 0) {
        batchesToAdd.push({
          item_ankama_id: req.item_ankama_id,
          item_name: req.name,
          item_type: req.type || 'Ressource',
          item_icon: req.icon,
          item_level: 1,
          category: 'resources',
          quantity: qty,
          unit_price: price,
          total_price: qty * price,
          date: new Date().toISOString(),
          note: `Achat global pour ${activeItem?.name || 'Craft'}`
        })
      }
    })

    if (batchesToAdd.length > 0) {
      if (onAddMultipleBatches) {
        onAddMultipleBatches(batchesToAdd)
      } else if (onAddSingleBatch) {
        batchesToAdd.forEach(b => onAddSingleBatch(b))
      }

      setQuickToast(`${batchesToAdd.length} ressources achetées et ajoutées au stock`)
      setTimeout(() => setQuickToast(null), 3000)
    } else {
      setQuickToast(`Veuillez renseigner le prix des ressources ci-dessous.`)
      setTimeout(() => setQuickToast(null), 3000)
    }
  }

  // Master 1-Click: Index all prices only without adding stock
  const handleIndexAllPricesOnly = () => {
    const pricesToUpdate: Array<{ itemAnkamaId: number; price: number }> = []

    requirements.forEach(req => {
      const row = inlineInputs[req.item_ankama_id]
      const price = parseInt(row?.price || '') || 0
      if (price > 0) {
        pricesToUpdate.push({ itemAnkamaId: req.item_ankama_id, price })
      }
    })

    if (pricesToUpdate.length > 0) {
      if (onUpdateMultipleRefPrices) {
        onUpdateMultipleRefPrices(pricesToUpdate)
      } else {
        pricesToUpdate.forEach(p => onUpdateRefPrice(p.itemAnkamaId, p.price))
      }
      setQuickToast(`${pricesToUpdate.length} prix de référence enregistrés sans stock`)
      setTimeout(() => setQuickToast(null), 3000)
    }
  }

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
      {/* Toast Feedback */}
      {quickToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#161b22] border border-yellow-500/80 text-yellow-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top duration-150">
          <Check className="w-4 h-4 text-yellow-400" />
          <span>{quickToast}</span>
        </div>
      )}

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
          <div className="mt-4 pt-4 border-t border-[#30363d] space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Détail du Prix Estimé (Historique de vos achats HDV) :
              </span>
              <button
                type="button"
                onClick={() => setShowEstimationDetails(false)}
                className="text-slate-400 hover:text-white text-xs underline"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {estimatedCraft.ingredients.map((ing) => (
                <div
                  key={ing.item_ankama_id}
                  className="p-2 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={ing.item_icon} alt={ing.item_name} className="w-6 h-6 object-contain shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-white truncate block">{ing.item_name}</span>
                      <span className="text-[10px] text-slate-500">
                        {ing.hasKnownPrice ? (
                          <>Dernier: {formatKamas(ing.unitPrice)}/u {ing.date ? `(${formatDate(ing.date)})` : ''}</>
                        ) : (
                          <span className="text-amber-400">Prix non indexé</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-yellow-400 font-bold shrink-0">
                    {ing.hasKnownPrice ? formatKamas(ing.totalCost) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Picker Dropdown */}
        {showPicker && (
          <div className="mt-4 pt-4 border-t border-[#30363d] space-y-3 animate-in fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Rechercher un équipement à crafter (ex: Voile d'Encre, Gelano, Strigide...)"
                className="w-full pl-9 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-yellow-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
              {pickerResults.map((item) => (
                <button
                  key={item.ankama_id}
                  onClick={() => {
                    setActiveItem(item)
                    onSelectItem(item)
                    setShowPicker(false)
                    setPickerSearch('')
                  }}
                  className="p-2 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-yellow-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <img
                    src={item.image_urls?.icon}
                    alt={item.name}
                    className="w-7 h-7 object-contain group-hover:scale-105 transition"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white group-hover:text-yellow-400 truncate">
                      {item.name}
                    </p>
                    <span className="text-[10px] text-slate-500">Niv. {item.level}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Dual-Column Workshop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Recipe Requirements & Inline Quick HDV Purchasing */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-yellow-400" />
              Ingrédients Requis ({requirements.length})
            </h2>

            {/* Master 1-Click Fast Action Bar */}
            {requirements.length > 0 && !isFullySatisfied && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleBuyAllMissingInline}
                  className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                  title="Acheter et ajouter au stock toutes les ressources manquantes en 1 clic"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>Stocker les manquants</span>
                </button>

                <button
                  type="button"
                  onClick={handleIndexAllPricesOnly}
                  className="px-2.5 py-1.5 bg-[#1b1f27] hover:bg-[#252b37] text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1 border border-[#2b313d]"
                  title="Enregistrer les prix saisis sans ajouter au stock"
                >
                  <Tag className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Indexer les prix</span>
                </button>
              </div>
            )}

            {isFullySatisfied && (
              <span className="text-xs font-semibold text-slate-300 bg-[#1b1f27] border border-[#2b313d] px-2.5 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" />
                Stock complet pour x{craftQty}
              </span>
            )}
          </div>

          {isLoadingRecipe ? (
            <div className="bg-[#14171d] border border-[#232730] rounded-xl p-12 text-center text-slate-400 text-xs">
              Chargement de la recette...
            </div>
          ) : requirements.length === 0 ? (
            <div className="bg-[#14171d] border border-[#232730] rounded-xl p-12 text-center text-slate-400 text-xs space-y-1">
              <p className="font-bold text-slate-300">Aucune recette associée à cet item.</p>
              <p className="text-slate-500">Choisissez un équipement ou consommable craftable.</p>
            </div>
          ) : (
            <div className="bg-[#14171d] border border-[#232730] rounded-xl divide-y divide-[#1f242e] overflow-hidden">
              {requirements.map((req) => {
                const latest = latestKnownPrices[req.item_ankama_id]
                const row = inlineInputs[req.item_ankama_id] || { price: '', qty: req.missing_qty.toString() }

                return (
                  <div
                    key={req.item_ankama_id}
                    className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:bg-[#181c24] transition-colors"
                  >
                    {/* Left: Icon & Info */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 bg-[#0c0e12] rounded-lg border border-[#232730] p-1 flex items-center justify-center shrink-0">
                        <img
                          src={req.icon}
                          alt={req.name}
                          className="w-7 h-7 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                          }}
                        />
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-xs font-bold text-white truncate">{req.name}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>Requis : <strong className="text-yellow-400">{req.required_qty}</strong></span>
                          <span>•</span>
                          <span className={req.available_qty >= req.required_qty ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            En stock : {req.available_qty}
                          </span>
                          {!req.is_satisfied && (
                            <>
                              <span>•</span>
                              <span className="text-rose-400 font-bold font-mono">Manque: -{req.missing_qty}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Direct Inline Inputs & 1-Click Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
                      {/* Inline Unit Price Input */}
                      <div className="relative">
                        <input
                          type="number"
                          value={row.price}
                          onChange={(e) => handleUpdateInlineRow(req.item_ankama_id, 'price', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInlineBuyBatch(req)
                          }}
                          placeholder="Prix/u"
                          className="w-20 pl-2 pr-4 py-1 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs font-mono text-yellow-400 placeholder-slate-600 focus:border-yellow-500 outline-none"
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] text-slate-500 font-bold pointer-events-none">K</span>
                      </div>

                      {/* Inline Quantity Input */}
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={row.qty}
                          onChange={(e) => handleUpdateInlineRow(req.item_ankama_id, 'qty', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInlineBuyBatch(req)
                          }}
                          placeholder="Qté"
                          className="w-14 px-1.5 py-1 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs font-mono text-white text-center focus:border-yellow-500 outline-none"
                        />
                      </div>

                      {/* 1-Click Buy & Add to Stock */}
                      <button
                        type="button"
                        onClick={() => handleInlineBuyBatch(req)}
                        className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition shadow-xs shrink-0"
                        title="Ajouter directement ce lot au stock"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Stocker</span>
                      </button>

                      {/* 1-Click Save Reference Price Only */}
                      <button
                        type="button"
                        onClick={() => handleInlineIndexPrice(req)}
                        className="px-2 py-1 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-yellow-500 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition shrink-0"
                        title="Enregistrer le prix unitaire comme référence sans ajouter au stock"
                      >
                        <Tag className="w-3 h-3 text-yellow-400" />
                      </button>
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
