import React, { useState } from 'react'
import {
  BarChart3,
  Coins,
  TrendingUp,
  Hammer,
  Layers,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react'
import { StockItem, CraftRecord, SaleRecord } from '../types'
import { formatKamas, formatKamasCompact, formatDate } from '../utils/formatters'

interface AnalyticsViewProps {
  stockItems: StockItem[]
  craftHistory: CraftRecord[]
  salesHistory: SaleRecord[]
  totalStockValue: number
  totalSpentPurchases: number
  totalNetProfit: number
  totalCraftCount: number
  onExportJson: () => string
  onImportJson: (json: string) => { success: boolean; error?: string }
  onResetDemo: () => void
  onClearAll: () => void
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stockItems,
  craftHistory,
  salesHistory,
  totalStockValue,
  totalSpentPurchases,
  totalNetProfit,
  totalCraftCount,
  onExportJson,
  onImportJson,
  onResetDemo,
  onClearAll
}) => {
  const [importJsonText, setImportJsonText] = useState('')
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [copiedExport, setCopiedExport] = useState(false)

  const handleCopyExport = () => {
    const json = onExportJson()
    navigator.clipboard.writeText(json)
    setCopiedExport(true)
    setTimeout(() => setCopiedExport(false), 2000)
  }

  const handleDownloadFile = () => {
    const json = onExportJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dofuscraft-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return
    const res = onImportJson(importJsonText)
    if (res.success) {
      setImportStatus('✅ Importation réussie ! Vos données ont été rechargées.')
      setImportJsonText('')
    } else {
      setImportStatus(`❌ Erreur: ${res.error}`)
    }
  }

  // Top stocked items by value
  const topStocked = [...stockItems].sort((a, b) => b.total_value - a.total_value).slice(0, 5)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="dofus-card rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl font-bold font-dofus text-slate-100">
            Rapports, Bilan & Données
          </h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dofus-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Valeur du Stock Actuel
          </span>
          <p className="text-xl font-bold font-mono text-amber-400">{formatKamas(totalStockValue)}</p>
          <span className="text-[10px] text-slate-500">{stockItems.length} références en coffre</span>
        </div>

        <div className="dofus-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Total Dépenses HDV
          </span>
          <p className="text-xl font-bold font-mono text-slate-200">{formatKamas(totalSpentPurchases)}</p>
          <span className="text-[10px] text-slate-500">Achats indexés</span>
        </div>

        <div className="dofus-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Bénéfice Net Ventes
          </span>
          <p className={`text-xl font-bold font-mono ${totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalNetProfit >= 0 ? '+' : ''}{formatKamas(totalNetProfit)}
          </p>
          <span className="text-[10px] text-slate-500">{salesHistory.length} ventes conclues</span>
        </div>

        <div className="dofus-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Total Crafts Exécutés
          </span>
          <p className="text-xl font-bold font-mono text-amber-300">{totalCraftCount} items</p>
          <span className="text-[10px] text-slate-500">{craftHistory.length} sessions de craft</span>
        </div>
      </div>

      {/* 2 Column Layout: Top Stocks vs Craft History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Stock Values */}
        <div className="dofus-card rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-100 font-dofus text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Top 5 Stocks par Valeur Immobilisée
          </h3>

          {topStocked.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Aucun stock disponible.</p>
          ) : (
            <div className="space-y-2">
              {topStocked.map((item) => (
                <div
                  key={item.item_ankama_id}
                  className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={item.icon} alt={item.name} className="w-8 h-8 object-contain" />
                    <div>
                      <p className="text-xs font-bold text-slate-100">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.total_quantity} en stock • PRU {formatKamas(item.pru)}</p>
                    </div>
                  </div>
                  <span className="font-mono text-amber-400 font-bold text-xs">
                    {formatKamas(item.total_value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Craft Sessions */}
        <div className="dofus-card rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-100 font-dofus text-base flex items-center gap-2">
            <Hammer className="w-4 h-4 text-amber-400" />
            Dernières Sessions de Fabrication
          </h3>

          {craftHistory.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Aucun craft exécuté pour l'instant.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {craftHistory.slice(0, 6).map((craft) => (
                <div
                  key={craft.id}
                  className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={craft.item_icon} alt={craft.item_name} className="w-8 h-8 object-contain" />
                    <div>
                      <p className="text-xs font-bold text-slate-100">
                        +{craft.quantity}x {craft.item_name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatDate(craft.date)} • {craft.consumed_resources.length} ingrédients déduits
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-amber-400 font-bold text-xs block">
                      PRU: {formatKamas(craft.unit_craft_cost)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Total: {formatKamas(craft.total_craft_cost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Backup, Import & Reset Management Section */}
      <div className="dofus-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-slate-100 font-dofus text-base flex items-center gap-2">
          <Download className="w-4 h-4 text-amber-400" />
          Sauvegarde & Gestion des Données
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Export */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Exporter vos données
            </h4>
            <p className="text-xs text-slate-400">
              Téléchargez votre historique complet (achats, stocks, ventes, PRU) au format JSON.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadFile}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger JSON</span>
              </button>
              <button
                onClick={handleCopyExport}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold transition"
              >
                {copiedExport ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>

          {/* Import */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Importer des données
            </h4>
            <input
              type="text"
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Collez votre code JSON ici..."
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-500 outline-none font-mono"
            />
            <button
              onClick={handleImportSubmit}
              disabled={!importJsonText.trim()}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restaurer les Données</span>
            </button>
            {importStatus && (
              <p className="text-[11px] text-amber-300 mt-1">{importStatus}</p>
            )}
          </div>

          {/* Reset / Clear */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Réinitialisation
            </h4>
            <p className="text-xs text-slate-400">
              Rechargez le jeu de démo avec des lots de Gelano et runes, ou effacez tout.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm('Recharger les données de démonstration ?')) onResetDemo()
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Démo</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Attention : cela va effacer tous vos achats et stocks. Continuer ?')) onClearAll()
                }}
                className="py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer tout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
