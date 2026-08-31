import React, { useState, useEffect } from 'react'
import { X, Sparkles, Plus, Trash2, Check, Search, TrendingUp, TrendingDown, Percent, Hammer } from 'lucide-react'
import confetti from 'canvas-confetti'
import { StockItem, DofusItem } from '../types'
import { DOFUS_RUNES, runeToDofusItem } from '../data/runesData'
import { formatKamas } from '../utils/formatters'

interface CrushItemModalProps {
  isOpen: boolean
  item: StockItem | null
  referencePrices: Record<number, number>
  onClose: () => void
  onRecordCrush: (
    item: StockItem,
    quantity: number,
    runesObtained: Array<{
      rune: DofusItem
      quantity: number
      unitPrice: number
    }>,
    coefficientPercent?: number,
    focus?: string,
    addRunesToStock?: boolean
  ) => any
}

interface RuneRow {
  rune: DofusItem
  quantity: number
  unitPrice: number
}

export const CrushItemModal: React.FC<CrushItemModalProps> = ({
  isOpen,
  item,
  referencePrices,
  onClose,
  onRecordCrush
}) => {
  const [crushQty, setCrushQty] = useState<number>(1)
  const [coefficient, setCoefficient] = useState<number>(100)
  const [focus, setFocus] = useState<string>('Aucun (Naturel)')
  const [runeRows, setRuneRows] = useState<RuneRow[]>([])
  const [searchRune, setSearchRune] = useState<string>('')
  const [addRunesToStock, setAddRunesToStock] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Initialize modal when opening with item
  useEffect(() => {
    if (isOpen && item) {
      setCrushQty(1)
      setCoefficient(100)
      setFocus('Aucun (Naturel)')
      setRuneRows([])
      setSearchRune('')
      setAddRunesToStock(true)
    }
  }, [isOpen, item])

  if (!isOpen || !item) return null

  // Available runes from static dataset
  const allRunes: DofusItem[] = DOFUS_RUNES.map(r => runeToDofusItem(r))

  const filteredRunes = searchRune.trim()
    ? allRunes.filter(r => r.name.toLowerCase().includes(searchRune.toLowerCase())).slice(0, 10)
    : allRunes.slice(0, 10)

  const handleAddRune = (rune: DofusItem, defaultQty = 1) => {
    setRuneRows(prev => {
      const existing = prev.find(r => r.rune.ankama_id === rune.ankama_id)
      if (existing) {
        return prev.map(r =>
          r.rune.ankama_id === rune.ankama_id
            ? { ...r, quantity: r.quantity + defaultQty }
            : r
        )
      }

      const refPrice = referencePrices[rune.ankama_id] || 250
      return [...prev, { rune, quantity: defaultQty, unitPrice: refPrice }]
    })
    setSearchRune('')
  }

  const handleUpdateRuneQty = (ankamaId: number, qty: number) => {
    setRuneRows(prev =>
      prev.map(r =>
        r.rune.ankama_id === ankamaId
          ? { ...r, quantity: Math.max(1, qty) }
          : r
      )
    )
  }

  const handleUpdateRunePrice = (ankamaId: number, price: number) => {
    setRuneRows(prev =>
      prev.map(r =>
        r.rune.ankama_id === ankamaId
          ? { ...r, unitPrice: Math.max(0, price) }
          : r
      )
    )
  }

  const handleRemoveRune = (ankamaId: number) => {
    setRuneRows(prev => prev.filter(r => r.rune.ankama_id !== ankamaId))
  }

  // Financial calculations
  const totalItemCost = (item.pru || 0) * crushQty
  const totalRunesValue = runeRows.reduce((acc, r) => acc + (r.quantity * r.unitPrice), 0)
  const netProfit = totalRunesValue - totalItemCost
  const roiPercent = totalItemCost > 0 ? Math.round(((netProfit / totalItemCost) * 100) * 10) / 10 : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || crushQty <= 0 || runeRows.length === 0) return

    setIsSubmitting(true)
    onRecordCrush(
      item,
      crushQty,
      runeRows,
      coefficient,
      focus === 'Aucun (Naturel)' ? undefined : focus,
      addRunesToStock
    )
    setIsSubmitting(false)

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#a855f7', '#ec4899', '#eab308']
      })
    } catch {}

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0d1117] border-b border-[#30363d]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/15 border border-purple-500/40 rounded-xl text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Enregistrer un Brisage d'Item</span>
                <span className="text-xs font-normal text-slate-400">• Forgemagie</span>
              </h2>
              <p className="text-xs text-slate-400">
                Notez les runes obtenues pour historiser vos brisages et leur rentabilité
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Target Item Card */}
          <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={item.icon}
                alt={item.name}
                className="w-12 h-12 object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                }}
              />
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm truncate">{item.name}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#21262d] text-yellow-400 font-mono rounded">
                    Niv. {item.level}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  En stock : <strong className="text-emerald-400">{item.total_quantity} u</strong> • PRU de fabrication : <strong className="text-yellow-400 font-mono">{formatKamas(item.pru)}/u</strong>
                </p>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400">À briser :</span>
              <input
                type="number"
                min="1"
                max={item.total_quantity}
                value={crushQty}
                onChange={(e) => setCrushQty(Math.min(item.total_quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 px-2 py-1 bg-[#161b22] border border-[#30363d] rounded-lg text-center font-mono text-yellow-400 font-bold outline-none"
              />
            </div>
          </div>

          {/* Coefficient & Focus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Taux / Coefficient obtenu (%)</span>
                <span className="text-[10px] text-slate-500">Ex: 100%, 150%, 80%</span>
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={coefficient}
                  onChange={(e) => setCoefficient(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="100"
                  className="w-full pl-9 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs font-mono text-white outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Focus Rune (Optionnel)
              </label>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white outline-none focus:border-yellow-500"
              >
                <option value="Aucun (Naturel)">Aucun (Brisage naturel)</option>
                <option value="Rune Ga Pâ">Focus Rune Ga Pâ (PA)</option>
                <option value="Rune Ga Pme">Focus Rune Ga Pme (PM)</option>
                <option value="Rune Po">Focus Rune Po (Portée)</option>
                <option value="Rune Invo">Focus Rune Invo (Invocations)</option>
                <option value="Rune Ra Fo">Focus Rune Ra Fo (Force)</option>
                <option value="Rune Ra Vi">Focus Rune Ra Vi (Vitalité)</option>
                <option value="Autre">Autre Focus</option>
              </select>
            </div>
          </div>

          {/* Runes Obtained Section */}
          <div className="space-y-3 pt-2 border-t border-[#30363d]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Runes obtenues après brisage ({runeRows.length})</span>
              </label>
              <span className="text-[10px] text-slate-500">Sélectionnez les runes générées</span>
            </div>

            {/* Quick Add Rune Search & Common Chips */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchRune}
                  onChange={(e) => setSearchRune(e.target.value)}
                  placeholder="Rechercher une rune à ajouter (ex: Ga Pâ, Ra Fo, Pa Vi, Trans...)..."
                  className="w-full pl-8 pr-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                />
              </div>

              {/* Quick rune suggestions */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                {filteredRunes.map(r => (
                  <button
                    key={r.ankama_id}
                    type="button"
                    onClick={() => handleAddRune(r, 1)}
                    className="px-2.5 py-1 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-purple-500 rounded-lg text-slate-300 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition"
                  >
                    <img src={r.image_urls?.icon} alt={r.name} className="w-4 h-4 object-contain" />
                    <span>+ {r.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Runes Rows Table */}
            {runeRows.length === 0 ? (
              <div className="p-6 bg-[#0d1117] border border-dashed border-[#30363d] rounded-xl text-center text-xs text-slate-500">
                Aucune rune ajoutée. Cliquez sur une rune ci-dessus pour l'ajouter au brisage.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {runeRows.map(r => (
                  <div
                    key={r.rune.ankama_id}
                    className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={r.rune.image_urls?.icon} alt={r.rune.name} className="w-6 h-6 object-contain shrink-0" />
                      <span className="font-bold text-white truncate">{r.rune.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">Qté :</span>
                        <input
                          type="number"
                          min="1"
                          value={r.quantity}
                          onChange={(e) => handleUpdateRuneQty(r.rune.ankama_id, parseInt(e.target.value) || 1)}
                          className="w-14 px-1.5 py-0.5 bg-[#161b22] border border-[#30363d] rounded font-mono text-yellow-400 text-center font-bold outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">Prix unitaire :</span>
                        <input
                          type="number"
                          min="0"
                          value={r.unitPrice}
                          onChange={(e) => handleUpdateRunePrice(r.rune.ankama_id, parseInt(e.target.value) || 0)}
                          className="w-20 px-1.5 py-0.5 bg-[#161b22] border border-[#30363d] rounded font-mono text-yellow-400 text-right outline-none"
                        />
                        <span className="text-slate-500 text-[10px]">K</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRune(r.rune.ankama_id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Coût de fabrication de l'item ({crushQty}x) :</span>
              <span className="font-mono text-white font-bold">{formatKamas(totalItemCost)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Valeur totale estimée des runes générées :</span>
              <span className="font-mono text-purple-400 font-bold">{formatKamas(totalRunesValue)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#21262d] font-bold">
              <span className="text-white">Bénéfice Net du Brisage :</span>
              <span className={`font-mono text-sm ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netProfit >= 0 ? '+' : ''}{formatKamas(netProfit)} ({roiPercent.toFixed(1)}% ROI)
              </span>
            </div>
          </div>

          {/* Add Runes to Stock Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={addRunesToStock}
              onChange={(e) => setAddRunesToStock(e.target.checked)}
              className="w-4 h-4 rounded bg-[#0d1117] border-[#30363d] text-yellow-500 accent-yellow-400 cursor-pointer"
            />
            <span>Ajouter automatiquement ces runes obtenues dans mon inventaire / stock</span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || runeRows.length === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Hammer className="w-4 h-4" />
            <span>Valider le Brisage de {crushQty}x {item.name}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
