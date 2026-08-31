import React, { useState, useEffect } from 'react'
import {
  ListPlus,
  ShoppingCart,
  Copy,
  Check,
  Trash2,
  Hammer,
  Plus,
  Minus,
  Sparkles,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
  ExternalLink,
  Search,
  MessageSquare
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { DofusItem, StockItem, CraftPlanItem, AggregatedCraftIngredient } from '../types'
import { formatKamas, formatKamasCompact } from '../utils/formatters'
import { fetchItemById, enrichRecipeIngredients, searchDofusItems } from '../services/dofusApi'

interface MultiCraftPlannerViewProps {
  craftPlan: CraftPlanItem[]
  stockItems: StockItem[]
  referencePrices: Record<number, number>
  onUpdateQuantity: (planId: string, qty: number) => void
  onRemovePlanItem: (planId: string) => void
  onClearPlan: () => void
  onAddToPlan: (item: DofusItem, qty?: number) => void
  onExecuteAllCrafts: (item: DofusItem, qty: number, recipe: any[]) => void
  onOpenHDVWithItem: (item: DofusItem) => void
}

export const MultiCraftPlannerView: React.FC<MultiCraftPlannerViewProps> = ({
  craftPlan,
  stockItems,
  referencePrices,
  onUpdateQuantity,
  onRemovePlanItem,
  onClearPlan,
  onAddToPlan,
  onExecuteAllCrafts,
  onOpenHDVWithItem
}) => {
  const [enrichedRecipes, setEnrichedRecipes] = useState<Record<number, any[]>>({})
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [quickSearch, setQuickSearch] = useState('')
  const [searchResults, setSearchResults] = useState<DofusItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [chatMessageStyle, setChatMessageStyle] = useState<'commerce' | 'artisan' | 'short' | 'hdv'>('commerce')

  // Search items to add to plan
  useEffect(() => {
    if (!quickSearch.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      const results = await searchDofusItems(quickSearch, 'equipment')
      setSearchResults(results.slice(0, 8))
      setIsSearching(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [quickSearch])

  // Load and enrich recipes for all items in the plan
  useEffect(() => {
    let active = true
    const load = async () => {
      if (craftPlan.length === 0) return
      setIsLoadingRecipes(true)

      const map: Record<number, any[]> = {}
      for (const p of craftPlan) {
        let fullItem = p.item
        if (!fullItem.recipe || fullItem.recipe.length === 0) {
          const fetched = await fetchItemById(p.item.ankama_id, p.item.category || 'equipment')
          if (fetched && fetched.recipe) fullItem = fetched
        }
        if (fullItem.recipe) {
          const enriched = await enrichRecipeIngredients(fullItem.recipe)
          map[p.item.ankama_id] = enriched
        }
      }

      if (active) {
        setEnrichedRecipes(map)
        setIsLoadingRecipes(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [craftPlan])

  // Build aggregated ingredients checklist
  const aggregatedIngredients: AggregatedCraftIngredient[] = React.useMemo(() => {
    const map = new Map<number, AggregatedCraftIngredient>()

    craftPlan.forEach(plan => {
      const recipe = enrichedRecipes[plan.item.ankama_id] || plan.item.recipe || []
      recipe.forEach((ing: any) => {
        const requiredForThisCraft = (ing.quantity || 1) * plan.quantity
        const existing = map.get(ing.item_ankama_id)

        if (existing) {
          existing.total_required += requiredForThisCraft
          existing.contributing_crafts.push({
            craft_name: plan.item.name,
            qty: requiredForThisCraft
          })
        } else {
          const stock = stockItems.find(s => s.item_ankama_id === ing.item_ankama_id)
          const inStock = stock ? stock.total_quantity : 0
          const pru = stock ? stock.pru : (referencePrices[ing.item_ankama_id] || 0)

          map.set(ing.item_ankama_id, {
            item_ankama_id: ing.item_ankama_id,
            item_name: ing.item_name || `Ressource #${ing.item_ankama_id}`,
            item_icon: ing.item_icon || `https://api.dofusdu.de/dofus3/v1/img/item/${ing.item_ankama_id}-64.png`,
            total_required: requiredForThisCraft,
            in_stock: inStock,
            missing_deficit: 0,
            unit_pru: pru,
            estimated_cost: 0,
            contributing_crafts: [
              { craft_name: plan.item.name, qty: requiredForThisCraft }
            ]
          })
        }
      })
    })

    const list = Array.from(map.values())
    list.forEach(item => {
      item.missing_deficit = Math.max(0, item.total_required - item.in_stock)
      item.estimated_cost = item.missing_deficit * item.unit_pru
    })

    // Sort: missing ingredients first
    list.sort((a, b) => {
      if (a.missing_deficit > 0 && b.missing_deficit === 0) return -1
      if (a.missing_deficit === 0 && b.missing_deficit > 0) return 1
      return b.missing_deficit - a.missing_deficit
    })

    return list
  }, [craftPlan, enrichedRecipes, stockItems, referencePrices])

  const totalMissingItemsCount = aggregatedIngredients.filter(i => i.missing_deficit > 0).length
  const totalEstimatedShoppingCost = aggregatedIngredients.reduce((acc, i) => acc + i.estimated_cost, 0)
  const isEverythingInStock = aggregatedIngredients.length > 0 && totalMissingItemsCount === 0

  // Format Dofus natural chat messages
  const generateDofusChatMessage = (style: 'commerce' | 'artisan' | 'short' | 'hdv') => {
    const missingOnly = aggregatedIngredients.filter(i => i.missing_deficit > 0)
    if (missingOnly.length === 0) return ''

    const itemsFormatted = missingOnly
      .map(i => `${i.missing_deficit} [${i.item_name}]`)
      .join(', ')

    switch (style) {
      case 'commerce':
        return `J'achete en masse : ${itemsFormatted} mp moi avec vos prix svp !`
      case 'artisan':
        return `Artisan cherche : ${missingOnly.map(i => `${i.missing_deficit}x [${i.item_name}]`).join(' / ')} /w moi`
      case 'short':
        return `achete ${missingOnly.map(i => `${i.missing_deficit} [${i.item_name}]`).join(' + ')}`
      case 'hdv':
        return missingOnly.map(i => `${i.item_name} : ${i.missing_deficit} u`).join('\n')
    }
  }

  const handleCopyChatMessage = (style: 'commerce' | 'artisan' | 'short' | 'hdv') => {
    const text = generateDofusChatMessage(style)
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedType(style)
    setTimeout(() => setCopiedType(null), 2500)
  }

  const handleExecuteAll = () => {
    craftPlan.forEach(plan => {
      const recipe = enrichedRecipes[plan.item.ankama_id] || plan.item.recipe || []
      onExecuteAllCrafts(plan.item, plan.quantity, recipe)
    })
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
    onClearPlan()
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-yellow-400" />
            Planificateur Multi-Crafts & Liste de Courses
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Planifiez plusieurs crafts simultanés et obtenez votre liste de courses HDV avec le message de commerce prêt à coller en jeu.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#0d1117] px-4 py-2 rounded-xl border border-[#30363d]">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Crafts Prévus</span>
            <span className="text-sm font-bold font-mono text-white">
              {craftPlan.reduce((acc, p) => acc + p.quantity, 0)} items
            </span>
          </div>
          <div className="h-6 w-px bg-[#30363d]" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Coût Courses HDV</span>
            <span className="text-sm font-bold font-mono text-yellow-400">
              {formatKamas(totalEstimatedShoppingCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Left Planned Crafts | Right Shopping List & Chat Messenger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 cols): Planned Crafts List + Quick Add */}
        <div className="lg:col-span-5 bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3 flex flex-col max-h-[780px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Hammer className="w-4 h-4 text-yellow-400" />
              File de Craft ({craftPlan.length})
            </span>
            {craftPlan.length > 0 && (
              <button
                type="button"
                onClick={onClearPlan}
                className="text-xs text-rose-400 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider la file</span>
              </button>
            )}
          </div>

          {/* Quick Add Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Ajouter un équipement à la file..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-yellow-500"
            />

            {/* Quick search popup results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-[#21262d]">
                {searchResults.map(item => (
                  <button
                    key={item.ankama_id}
                    type="button"
                    onClick={() => {
                      onAddToPlan(item, 1)
                      setQuickSearch('')
                      setSearchResults([])
                    }}
                    className="w-full p-2 hover:bg-[#21262d] flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <img src={item.image_urls?.icon} alt={item.name} className="w-6 h-6 object-contain" />
                      <span className="text-xs font-bold text-white">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-yellow-400 font-mono">Niv.{item.level}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Crafts Queue Items */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {craftPlan.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                <Package className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">Aucun craft planifié.</p>
                <p className="text-[11px] text-slate-500">
                  Recherchez un équipement ci-dessus ou ajoutez-le depuis le catalogue pour générer la liste de courses.
                </p>
              </div>
            ) : (
              craftPlan.map(plan => (
                <div
                  key={plan.id}
                  className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-center justify-between gap-2 transition hover:border-slate-500"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={plan.item.image_urls?.icon}
                      alt={plan.item.name}
                      className="w-8 h-8 object-contain shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                      }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{plan.item.name}</p>
                      <span className="text-[10px] text-slate-400">
                        {plan.item.type?.name} • Niv.{plan.item.level}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(plan.id, plan.quantity - 1)}
                      disabled={plan.quantity <= 1}
                      className="w-6 h-6 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] disabled:opacity-30 rounded-lg flex items-center justify-center text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono text-yellow-400">
                      x{plan.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(plan.id, plan.quantity + 1)}
                      className="w-6 h-6 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-lg flex items-center justify-center text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePlanItem(plan.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 ml-1 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Consolidated Shopping List & Chat Messenger */}
        <div className="lg:col-span-7 space-y-3">
          {/* Natural Dofus Trade Message Generator Box */}
          {aggregatedIngredients.length > 0 && totalMissingItemsCount > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-yellow-400" />
                  Message Chat Commerce Dofus
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Prêt à coller en canal /b ou mp
                </span>
              </div>

              {/* Message format style selector */}
              <div className="flex gap-1 overflow-x-auto text-[11px]">
                {[
                  { id: 'commerce' as const, label: '📢 Canal Commerce' },
                  { id: 'artisan' as const, label: '🔨 Artisan' },
                  { id: 'short' as const, label: '⚡ Format Court' },
                  { id: 'hdv' as const, label: '📋 Bloc-notes' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setChatMessageStyle(s.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                      chatMessageStyle === s.id
                        ? 'bg-yellow-400 text-slate-950'
                        : 'bg-[#0d1117] text-slate-400 hover:text-white border border-[#30363d]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Generated message preview */}
              <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl font-mono text-xs text-yellow-200/90 leading-relaxed break-words">
                {generateDofusChatMessage(chatMessageStyle)}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleCopyChatMessage(chatMessageStyle)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  {copiedType === chatMessageStyle ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copié dans le presse-papier !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier le message pour Dofus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Consolidated Ingredients Shopping List Table */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
            <div className="p-3.5 px-4 border-b border-[#30363d] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-yellow-400" />
                  Liste de Courses HDV ({aggregatedIngredients.length} ressources)
                </span>
              </div>

              {isEverythingInStock ? (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
                  ✅ 100% en stock
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded-lg">
                  ⚠️ {totalMissingItemsCount} manquants
                </span>
              )}
            </div>

            {/* List */}
            {aggregatedIngredients.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-2">
                <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-200 text-sm">Aucune ressource requise.</p>
                <p className="text-xs text-slate-500">
                  Ajoutez des crafts dans la colonne de gauche pour calculer la liste de courses.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#21262d] max-h-[460px] overflow-y-auto">
                {aggregatedIngredients.map(ing => (
                  <div
                    key={ing.item_ankama_id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-[#21262d]/40 transition"
                  >
                    {/* Item info */}
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      <img
                        src={ing.item_icon}
                        alt={ing.item_name}
                        className="w-7 h-7 object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                        }}
                      />
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">
                          {ing.item_name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Requis pour : {ing.contributing_crafts.map(c => `${c.craft_name} (${c.qty})`).join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Stock vs Required */}
                    <div className="text-center min-w-[120px]">
                      <span className="text-xs font-mono font-bold text-white block">
                        {ing.in_stock} / {ing.total_required} u
                      </span>
                      {ing.missing_deficit > 0 ? (
                        <span className="text-[11px] font-bold text-rose-400 font-mono">
                          Manque : -{ing.missing_deficit} u
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-400 font-mono">
                          Complet ✅
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2">
                      {ing.missing_deficit > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenHDVWithItem({
                              ankama_id: ing.item_ankama_id,
                              name: ing.item_name,
                              type: { id: 0, name: 'Ressource' },
                              level: 1,
                              image_urls: { icon: ing.item_icon },
                              category: 'resources'
                            })
                          }
                          className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg text-xs transition"
                          title="Acheter en HDV"
                        >
                          + Achat HDV
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Execution Bar */}
            {aggregatedIngredients.length > 0 && (
              <div className="p-3 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Coût Total des Achats Manquants :
                  </span>
                  <span className="font-mono text-sm font-bold text-yellow-400">
                    {formatKamas(totalEstimatedShoppingCost)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteAll}
                  className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Exécuter tous les Crafts en 1 Clic</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
