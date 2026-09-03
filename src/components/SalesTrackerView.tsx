import React, { useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  Plus,
  Coins,
  Percent,
  Calendar,
  Check,
  X
} from 'lucide-react'
import { SaleRecord, StockItem } from '../types'
import { formatKamas, formatKamasCompact, formatDate } from '../utils/formatters'
import { KamaInput } from './KamaInput'

interface SalesTrackerViewProps {
  salesHistory: SaleRecord[]
  stockItems: StockItem[]
  onRecordSale: (
    item: StockItem,
    quantity: number,
    unitSalePrice: number,
    taxRate?: number
  ) => any
}

export const SalesTrackerView: React.FC<SalesTrackerViewProps> = ({
  salesHistory,
  stockItems,
  onRecordSale
}) => {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null)
  const [saleQty, setSaleQty] = useState<number>(1)
  const [unitSalePrice, setUnitSalePrice] = useState<number>(0)
  const [taxPercent, setTaxPercent] = useState<number>(2)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const totalNetProfit = salesHistory.reduce((acc, s) => acc + s.net_profit, 0)
  const totalRevenue = salesHistory.reduce((acc, s) => acc + s.total_net, 0)
  const totalCost = salesHistory.reduce((acc, s) => acc + s.total_cost, 0)
  const overallROI = totalCost > 0 ? (totalNetProfit / totalCost) * 100 : 0

  const handleOpenSaleWithItem = (item: StockItem) => {
    setSelectedStockItem(item)
    setSaleQty(Math.min(item.total_quantity, 1))
    setUnitSalePrice(item.reference_price || Math.round(item.pru * 1.3))
    setIsSaleModalOpen(true)
  }

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStockItem || saleQty <= 0 || unitSalePrice <= 0) return

    onRecordSale(
      selectedStockItem,
      saleQty,
      unitSalePrice,
      taxPercent / 100
    )

    setToastMessage('Vente enregistrée avec succès !')
    setTimeout(() => {
      setToastMessage(null)
      setIsSaleModalOpen(false)
      setSelectedStockItem(null)
    }, 800)
  }

  // Live simulation in modal
  const itemPru = selectedStockItem ? selectedStockItem.pru : 0
  const grossTotal = saleQty * unitSalePrice
  const taxAmount = Math.round(grossTotal * (taxPercent / 100))
  const netTotal = grossTotal - taxAmount
  const costTotal = saleQty * itemPru
  const simulatedProfit = netTotal - costTotal
  const simulatedROI = costTotal > 0 ? (simulatedProfit / costTotal) * 100 : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="dofus-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-bold font-dofus text-slate-100">
              Suivi des Ventes & Bénéfices
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enregistrez vos ventes HDV, déduisez les taxes et analysez votre marge réelle par rapport à votre PRU.
          </p>
        </div>

        <button
          onClick={() => {
            if (stockItems.length > 0) setSelectedStockItem(stockItems[0])
            setIsSaleModalOpen(true)
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer une Vente</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dofus-card rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Bénéfice Net Réalisé
            </span>
            <span className={`text-lg font-bold font-mono ${totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalNetProfit >= 0 ? '+' : ''}{formatKamas(totalNetProfit)}
            </span>
          </div>
        </div>

        <div className="dofus-card rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Chiffre d'Affaires Net
            </span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {formatKamas(totalRevenue)}
            </span>
          </div>
        </div>

        <div className="dofus-card rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 text-blue-400">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              ROI Global (Rentabilité)
            </span>
            <span className={`text-lg font-bold font-mono ${overallROI >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {overallROI >= 0 ? '+' : ''}{overallROI.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Sales History Log */}
      <div className="dofus-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-100 font-dofus text-base">
            Historique des Ventes ({salesHistory.length})
          </h3>
        </div>

        {salesHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-300">Aucune vente enregistrée pour le moment.</p>
            <p className="text-xs text-slate-500 mt-1">
              Vendez vos items craftés pour générer vos premiers bénéfices !
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {salesHistory.map((sale) => (
              <div
                key={sale.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition"
              >
                {/* Item Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 bg-slate-950 rounded-xl border border-slate-800 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={sale.item_icon}
                      alt={sale.item_name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                      }}
                    />
                  </div>
                  <div>
                    <span className="font-bold text-slate-100 text-sm">
                      {sale.quantity}x {sale.item_name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(sale.date)}
                      </span>
                      <span>•</span>
                      <span>PRU: {formatKamas(sale.unit_craft_cost)}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Profit */}
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">Vendu à :</span>
                    <span className="font-mono text-amber-400 font-bold text-sm">
                      {formatKamas(sale.unit_sale_price)} / u
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Taxe -{formatKamas(sale.total_tax)}
                    </span>
                  </div>

                  <div className="text-right min-w-[120px]">
                    <span className="text-xs text-slate-400 block">Gain Net :</span>
                    <span
                      className={`font-mono font-bold text-base block ${
                        sale.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {sale.net_profit >= 0 ? '+' : ''}{formatKamas(sale.net_profit)}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        sale.roi_percent >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'
                      }`}
                    >
                      ROI {sale.roi_percent >= 0 ? '+' : ''}{sale.roi_percent}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sale Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 font-dofus">
                  Enregistrer une Vente HDV
                </h3>
              </div>
              <button
                onClick={() => setIsSaleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSale} className="space-y-4">
              {/* Item Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Item en stock à vendre
                </label>
                <select
                  value={selectedStockItem?.item_ankama_id || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value)
                    const found = stockItems.find(it => it.item_ankama_id === id)
                    if (found) handleOpenSaleWithItem(found)
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:border-emerald-500 outline-none"
                >
                  {stockItems.map((it) => (
                    <option key={it.item_ankama_id} value={it.item_ankama_id} className="bg-slate-900">
                      {it.name} (Stock: {it.total_quantity} | PRU: {formatKamas(it.pru)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Quantité vendue
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={selectedStockItem?.total_quantity || 9999}
                    value={saleQty}
                    onChange={(e) => setSaleQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm"
                  />
                  <div className="flex gap-1">
                    {[1, 5, 10, selectedStockItem?.total_quantity || 1].map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSaleQty(q)}
                        className={`px-2 py-1 text-xs rounded border transition ${
                          saleQty === q
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {idx === 3 ? 'Max' : `x${q}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sale Price Input */}
              <div>
                <KamaInput
                  value={unitSalePrice}
                  onChange={(v) => setUnitSalePrice(v)}
                  label="Prix de vente unitaire HDV"
                  placeholder="Ex: 400k, 1.2m..."
                />
              </div>

              {/* Tax input */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Taxe HDV Ankama :</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-slate-200 font-mono"
                  />
                  <span>%</span>
                </div>
              </div>

              {/* Profit summary breakdown card */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Coût d'achat/craft (PRU x{saleQty}) :</span>
                  <span className="font-mono text-slate-300">{formatKamas(costTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Revenu net après taxe :</span>
                  <span className="font-mono text-slate-300">{formatKamas(netTotal)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-200">Bénéfice Net :</span>
                  <span className={`font-mono ${simulatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {simulatedProfit >= 0 ? '+' : ''}{formatKamas(simulatedProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">ROI :</span>
                  <span className={`font-mono font-semibold ${simulatedROI >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {simulatedROI >= 0 ? '+' : ''}{simulatedROI.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!selectedStockItem || saleQty <= 0 || unitSalePrice <= 0}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                {toastMessage ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>{toastMessage}</span>
                  </>
                ) : (
                  <span>Valider la Vente ({formatKamas(netTotal)})</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
