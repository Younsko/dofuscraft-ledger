import React, { useState } from 'react'
import {
  ShoppingBag,
  Search,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Coins,
  Repeat,
  Tag
} from 'lucide-react'
import { PurchaseBatch, DofusItem } from '../types'
import { formatKamas, formatKamasCompact, formatDate } from '../utils/formatters'

interface HDVHistoryViewProps {
  batches: PurchaseBatch[]
  onOpenHDVModal: () => void
  onOpenHDVWithItem: (item: DofusItem) => void
  onDeleteBatch: (batchId: string) => void
}

export const HDVHistoryView: React.FC<HDVHistoryViewProps> = ({
  batches,
  onOpenHDVModal,
  onOpenHDVWithItem,
  onDeleteBatch
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const totalSpent = batches.reduce((acc, b) => acc + b.total_price, 0)
  const totalItemsCount = batches.reduce((acc, b) => acc + b.quantity, 0)
  const remainingItemsCount = batches.reduce((acc, b) => acc + b.remaining_quantity, 0)

  const filtered = batches.filter((b) => {
    const matchesSearch =
      b.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.item_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.note && b.note.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCat = categoryFilter === 'all' || b.category === categoryFilter
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & KPI Header */}
      <div className="dofus-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-bold font-dofus text-slate-100">
              Journal des Achats HDV
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historique complet de tous vos achats et lots indexés en Hôtel des Ventes.
          </p>
        </div>

        <button
          onClick={onOpenHDVModal}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-xs flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Achat HDV</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dofus-card rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Total Dépensé HDV
            </span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {formatKamas(totalSpent)}
            </span>
          </div>
        </div>

        <div className="dofus-card rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-slate-300">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Lots Indexés
            </span>
            <span className="text-lg font-bold font-mono text-slate-200">
              {batches.length} lots
            </span>
          </div>
        </div>

        <div className="dofus-card rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Unités en Stock
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {remainingItemsCount.toLocaleString('fr-FR')} / {totalItemsCount.toLocaleString('fr-FR')} u
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par item, type ou note (ex: Trans Do So, HDV Bonta...)"
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Tout' },
            { id: 'resources', label: '🌿 Ressources' },
            { id: 'runes', label: '🔮 Runes' },
            { id: 'equipment', label: '⚔️ Équipements' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg transition text-xs font-semibold whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table / List */}
      {filtered.length === 0 ? (
        <div className="dofus-card rounded-2xl p-12 text-center text-slate-400">
          <p className="text-base font-semibold text-slate-300">Aucun achat trouvé.</p>
        </div>
      ) : (
        <div className="dofus-card rounded-2xl overflow-hidden divide-y divide-slate-800/80">
          {filtered.map((batch) => (
            <div
              key={batch.id}
              className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition"
            >
              {/* Item Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 bg-slate-950 rounded-xl border border-slate-800 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={batch.item_icon}
                    alt={batch.item_name}
                    className="w-9 h-9 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 bg-slate-900 text-amber-400 text-[9px] font-mono px-1 rounded border border-amber-500/30">
                    Niv.{batch.item_level}
                  </span>
                </div>

                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm truncate">
                      {batch.item_name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                      {batch.item_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(batch.date)}
                    </span>
                    {batch.note && (
                      <>
                        <span>•</span>
                        <span className="text-amber-300/80 italic text-[11px]">
                          "{batch.note}"
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity and Price */}
              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-left sm:text-right">
                  <span className="font-mono text-slate-200 font-bold text-sm block">
                    {batch.quantity}x
                  </span>
                  <span className={`text-[11px] font-mono ${batch.remaining_quantity > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    ({batch.remaining_quantity} restants)
                  </span>
                </div>

                <div className="text-right min-w-[110px]">
                  <span className="font-mono text-amber-400 font-bold text-sm block">
                    {formatKamas(batch.unit_price)} / u
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 block">
                    Total: {formatKamas(batch.total_price)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onOpenHDVWithItem({
                        ankama_id: batch.item_ankama_id,
                        name: batch.item_name,
                        type: { id: 0, name: batch.item_type },
                        level: batch.item_level,
                        image_urls: { icon: batch.item_icon },
                        category: batch.category
                      })
                    }
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-lg transition"
                    title="Racheter le même lot"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteBatch(batch.id)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg transition"
                    title="Supprimer la transaction"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
