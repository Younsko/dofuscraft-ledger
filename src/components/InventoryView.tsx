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
  PackageOpen
} from 'lucide-react'
import { StockItem, DofusItem } from '../types'
import { formatKamas, formatDate } from '../utils/formatters'

interface InventoryViewProps {
  stockItems: StockItem[]
  referencePrices: Record<number, number>
  onSelectItemForCraft: (item: DofusItem) => void
  onOpenHDVWithItem: (item: DofusItem) => void
  onOpenSaleModal: (item: StockItem) => void
  onDeleteBatch: (batchId: string) => void
  onUpdateRefPrice: (ankama_id: number, price: number) => void
  onOpenHDVModal: () => void
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  stockItems,
  referencePrices,
  onSelectItemForCraft,
  onOpenHDVWithItem,
  onOpenSaleModal,
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
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCat
  })

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0
    if (sortBy === 'value') diff = b.total_value - a.total_value
    else if (sortBy === 'quantity') diff = b.total_quantity - a.total_quantity
    else if (sortBy === 'pru') diff = b.pru - a.pru
    else if (sortBy === 'name') diff = a.name.localeCompare(b.name)
    return sortOrder === 'desc' ? diff : -diff
  })

  const totalStockValue = stockItems.reduce((acc, it) => acc + it.total_value, 0)
  const totalUnitsCount = stockItems.reduce((acc, it) => acc + it.total_quantity, 0)

  const handleStartEditRefPrice = (item: StockItem) => {
    setEditingRefPriceId(item.item_ankama_id)
    setTempRefPrice((referencePrices[item.item_ankama_id] || item.pru || 0).toString())
  }

  const handleSaveRefPrice = (ankama_id: number) => {
    const parsed = parseInt(tempRefPrice) || 0
    onUpdateRefPrice(ankama_id, parsed)
    setEditingRefPriceId(null)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-400" />
            Mon Coffre & Stock Réel
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi des lots achetés et calcul automatique du Prix de Revient Unitaire (PRU) pondéré.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#0d1117] px-4 py-2 rounded-xl border border-[#30363d]">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Unités en Stock</span>
            <span className="text-sm font-bold font-mono text-white">{totalUnitsCount} u</span>
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

      {/* Stock Cards / List */}
      {sorted.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-16 text-center text-slate-400 space-y-3">
          <PackageOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="font-bold text-slate-200 text-sm">Votre stock est actuellement vide.</p>
          <p className="text-xs text-slate-500">
            Cliquez sur le bouton ci-dessous pour indexer vos premiers achats HDV réels.
          </p>
          <button
            onClick={onOpenHDVModal}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Indexer un Achat HDV</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((item) => {
            const isExpanded = expandedItemId === item.item_ankama_id
            const refPrice = referencePrices[item.item_ankama_id] || item.pru || 0

            return (
              <div
                key={item.item_ankama_id}
                className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden transition hover:border-slate-500"
              >
                <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Item info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 bg-[#0d1117] rounded-xl border border-[#30363d] p-1 flex items-center justify-center shrink-0">
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                        }}
                      />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate">{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#21262d] text-slate-400 rounded">
                          {item.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-yellow-400 font-bold">
                          Stock : {item.total_quantity} u
                        </span>
                        <span>•</span>
                        <span>{item.batches.length} lot(s)</span>
                      </div>
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
                      >
                        <Hammer className="w-3 h-3" />
                        <span>Craft</span>
                      </button>

                      <button
                        onClick={() => onOpenSaleModal(item)}
                        className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Vendre</span>
                      </button>

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
                      Détail des lots achetés :
                    </span>
                    <div className="space-y-1">
                      {item.batches.map((b, idx) => (
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
