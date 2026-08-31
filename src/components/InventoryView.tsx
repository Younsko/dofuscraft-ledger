import React, { useState } from 'react'
import {
  Package,
  Search,
  ArrowUpDown,
  Hammer,
  DollarSign,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  Edit2,
  Check,
  PackageOpen,
  Sparkles,
  Percent
} from 'lucide-react'
import { StockItem, DofusItem, CrushRecord } from '../types'
import { formatKamas, formatDate } from '../utils/formatters'

interface InventoryViewProps {
  stockItems: StockItem[]
  referencePrices: Record<number, number>
  latestCrushesByItem?: Record<number, CrushRecord>
  onSelectItemForCraft: (item: DofusItem) => void
  onOpenHDVWithItem: (item: DofusItem) => void
  onOpenSaleModal: (item: StockItem) => void
  onOpenCrushModal?: (item: StockItem) => void
  onDeleteBatch: (batchId: string) => void
  onUpdateRefPrice: (ankama_id: number, price: number) => void
  onOpenHDVModal: () => void
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  stockItems,
  referencePrices,
  latestCrushesByItem = {},
  onSelectItemForCraft,
  onOpenHDVWithItem,
  onOpenSaleModal,
  onOpenCrushModal,
  onDeleteBatch,
  onUpdateRefPrice,
  onOpenHDVModal
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'value' | 'quantity' | 'pru' | 'name'>('value')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null)
  const [editingRefPriceId, setEditingRefPriceId] = useState<number | null>(null)
  const [tempRefPrice, setTempRefPrice] = useState<string>('')

  const filtered = stockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'value') cmp = a.total_value - b.total_value
    if (sortBy === 'quantity') cmp = a.total_quantity - b.total_quantity
    if (sortBy === 'pru') cmp = a.pru - b.pru
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
    return sortOrder === 'asc' ? cmp : -cmp
  })

  const totalStockValue = stockItems.reduce((acc, it) => acc + it.total_value, 0)
  const totalUnits = stockItems.reduce((acc, it) => acc + it.total_quantity, 0)

  const handleSaveRefPrice = (ankamaId: number) => {
    const parsed = parseInt(tempRefPrice) || 0
    if (parsed > 0) {
      onUpdateRefPrice(ankamaId, parsed)
    }
    setEditingRefPriceId(null)
    setTempRefPrice('')
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Summary Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0d1117] rounded-xl border border-[#30363d] flex items-center justify-center text-yellow-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Inventaire & Stock Réel</h1>
            <p className="text-xs text-slate-400">
              Valorisation en direct de vos ressources, équipements et runes selon la méthode FIFO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#0d1117] px-4 py-2 rounded-xl border border-[#30363d]">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Unités</span>
            <span className="text-sm font-bold font-mono text-white">{totalUnits.toLocaleString('fr-FR')} u</span>
          </div>
          <div className="h-6 w-px bg-[#30363d]" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Valeur Totale</span>
            <span className="text-sm font-bold font-mono text-yellow-400">{formatKamas(totalStockValue)}</span>
          </div>
        </div>
      </div>

      {/* Filter & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#161b22] p-3 rounded-2xl border border-[#30363d]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans votre stock..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-yellow-500"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'Tout' },
            { id: 'resources', label: '🌿 Ressources' },
            { id: 'runes', label: '🔮 Runes' },
            { id: 'equipment', label: '⚔️ Équipements' }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === c.id
                  ? 'bg-yellow-400 text-slate-950 font-bold'
                  : 'bg-[#21262d] text-slate-300 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-xs bg-[#0d1117] px-2.5 py-1 rounded-xl border border-[#30363d] text-slate-300">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-white outline-none cursor-pointer text-xs"
          >
            <option value="value" className="bg-[#161b22]">Valeur totale</option>
            <option value="quantity" className="bg-[#161b22]">Quantité</option>
            <option value="pru" className="bg-[#161b22]">PRU unitaire</option>
            <option value="name" className="bg-[#161b22]">Nom</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-slate-400 hover:text-white font-bold ml-1"
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Stock Items List */}
      {sorted.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-16 text-center text-slate-400 space-y-3">
          <PackageOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <p className="font-bold text-slate-200 text-sm">Votre inventaire est vide.</p>
            <p className="text-xs text-slate-500">
              Indexez vos achats HDV ou réalisez des crafts pour remplir votre stock.
            </p>
          </div>
          <button
            onClick={onOpenHDVModal}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-bold rounded-xl transition"
          >
            Indexer un Achat HDV
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((item) => {
            const isExpanded = expandedItemId === item.item_ankama_id
            const isEditingRef = editingRefPriceId === item.item_ankama_id
            const refPrice = referencePrices[item.item_ankama_id] || item.pru
            const lastCrush = latestCrushesByItem[item.item_ankama_id]

            return (
              <div
                key={item.item_ankama_id}
                className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden transition"
              >
                {/* Main Item Row */}
                <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 bg-[#0d1117] rounded-xl border border-[#30363d] p-1 flex items-center justify-center shrink-0">
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="w-9 h-9 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                        }}
                      />
                    </div>
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs truncate">{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#21262d] text-slate-400 rounded">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-yellow-400 font-mono">
                          Niv. {item.level}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-yellow-400 font-bold">
                          Stock : {item.total_quantity} u
                        </span>
                        <span>•</span>
                        <span>{item.batches.length} lot(s)</span>
                      </div>

                      {/* Previous Crush Output Pill */}
                      {lastCrush && (
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-purple-950/70 border border-purple-800 text-purple-300 rounded-full text-[10px] font-medium flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                            <span>Dernier brisage :</span>
                            <strong className="text-white">
                              {lastCrush.runes_obtained.map(r => `${r.quantity}x ${r.rune_name}`).join(', ')}
                            </strong>
                            <span>({formatKamas(lastCrush.total_runes_value)})</span>
                            {lastCrush.coefficient_percent && (
                              <span className="text-yellow-400 font-mono font-bold">• {lastCrush.coefficient_percent}%</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financials & Actions */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        PRU Moyen
                      </span>
                      <span className="font-mono font-bold text-yellow-400 text-xs">
                        {formatKamas(item.pru)} / u
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Total: {formatKamas(item.total_value)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          onSelectItemForCraft({
                            ankama_id: item.item_ankama_id,
                            name: item.name,
                            type: { id: 0, name: item.type },
                            level: item.level,
                            image_urls: { icon: item.icon },
                            category: item.category as any
                          })
                        }
                        className="px-2.5 py-1.5 bg-[#21262d] hover:bg-yellow-500 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-lg transition flex items-center gap-1"
                        title="Ouvrir dans l'Atelier de Craft"
                      >
                        <Hammer className="w-3 h-3" />
                        <span>Craft</span>
                      </button>

                      <button
                        onClick={() => onOpenSaleModal(item)}
                        className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title="Enregistrer une vente HDV"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Vendre</span>
                      </button>

                      {/* Brisage Button */}
                      {onOpenCrushModal && (
                        <button
                          onClick={() => onOpenCrushModal(item)}
                          className="px-2.5 py-1.5 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          title="Briser cet item et noter les runes obtenues"
                        >
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Briser</span>
                        </button>
                      )}

                      <button
                        onClick={() =>
                          onOpenHDVWithItem({
                            ankama_id: item.item_ankama_id,
                            name: item.name,
                            type: { id: 0, name: item.type },
                            level: item.level,
                            image_urls: { icon: item.icon },
                            category: item.category as any
                          })
                        }
                        className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-300 rounded-lg transition"
                        title="Acheter plus de ce lot"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : item.item_ankama_id)}
                        className="p-1.5 bg-[#0d1117] border border-[#30363d] text-slate-400 hover:text-white rounded-lg transition"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Batches */}
                {isExpanded && (
                  <div className="bg-[#0d1117] border-t border-[#30363d] p-3 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Détail des lots achetés ou craftés :
                    </span>
                    <div className="space-y-1">
                      {item.batches.map((b) => (
                        <div
                          key={b.id}
                          className="p-2 bg-[#161b22] rounded-lg border border-[#30363d] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-white">
                              {b.remaining_quantity} / {b.quantity} restants
                            </span>
                            <span className="text-slate-500 text-[11px] ml-2">
                              • {formatDate(b.date)}
                            </span>
                            {b.note && (
                              <span className="ml-2 text-[10px] text-yellow-400 bg-[#21262d] px-1.5 py-0.5 rounded">
                                {b.note}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-yellow-400 font-bold">
                              {formatKamas(b.unit_price)} / u
                            </span>
                            <button
                              onClick={() => onDeleteBatch(b.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition"
                              title="Supprimer ce lot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
