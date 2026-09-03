import React, { useState } from 'react'
import { Cloud, Check, X, RefreshCw, Database, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react'
import { tursoService } from '../services/tursoService'
import { marketSyncService } from '../services/marketSyncService'

interface CloudSyncModalProps {
  isOpen: boolean
  onClose: () => void
  currentServer: string
  onSyncComplete?: (count: number) => void
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentServer,
  onSyncComplete
}) => {
  const [urlInput, setUrlInput] = useState(tursoService.getTursoUrl())
  const [tokenInput, setTokenInput] = useState(tursoService.getTursoToken())
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(tursoService.isConfigured())
  const [showAdvanced, setShowAdvanced] = useState(false)

  if (!isOpen) return null

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = tursoService.saveConfig(urlInput, tokenInput)
    setIsConfigured(success)

    if (success) {
      setSyncStatusMessage('Connexion à Turso validée !')
      setIsSyncing(true)
      marketSyncService.initServerSync(currentServer)
      const count = await marketSyncService.syncFromCloud(currentServer)
      setIsSyncing(false)
      setSyncStatusMessage(`Synchronisation réussie (${count} cours mis à jour depuis le Cloud).`)
      if (onSyncComplete) onSyncComplete(count)
    } else {
      setSyncStatusMessage('URL ou Token invalide.')
    }
  }

  const handleManualSyncNow = async () => {
    setIsSyncing(true)
    setSyncStatusMessage('Synchronisation des cours en direct...')
    const count = await marketSyncService.syncFromCloud(currentServer)
    setIsSyncing(false)
    setSyncStatusMessage(`${count} cours actualisés depuis le Cloud !`)
    if (onSyncComplete) onSyncComplete(count)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#14171d] border border-[#232730] rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#232730]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-dofus flex items-center gap-2">
                <span>Réseau Cloud Communautaire</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded">
                  EN LIGNE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Synchronisation instantanée des cours HDV partagés par les joueurs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Card */}
        <div className="p-4 bg-[#0c0e12] rounded-xl border border-[#232730] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">
                Base Cloud Active (Turso)
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualSyncNow}
              disabled={isSyncing}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Actualiser les cours</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
            <div className="bg-[#14171d] p-2 rounded-lg border border-[#232730]">
              <span className="text-slate-500 block">Serveur actif :</span>
              <strong className="text-yellow-400 uppercase text-xs">{currentServer}</strong>
            </div>
            <div className="bg-[#14171d] p-2 rounded-lg border border-[#232730]">
              <span className="text-slate-500 block">Base de données :</span>
              <strong className="text-emerald-400 text-xs">kamacraft-db (EU)</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Tous vos scans et indexations sont automatiquement enregistrés et synchronisés pour la communauté.
            </span>
          </div>
        </div>

        {syncStatusMessage && (
          <div className="p-2.5 bg-[#122319] border border-[#1e462d] text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{syncStatusMessage}</span>
          </div>
        )}

        {/* Collapsible Advanced Settings (for Admin / Override) */}
        <div className="border-t border-[#232730] pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition cursor-pointer"
          >
            {showAdvanced ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>Paramètres avancés de la base de données</span>
          </button>

          {showAdvanced && (
            <form onSubmit={handleSaveConfig} className="space-y-3 pt-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Turso Database URL
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0c0e12] border border-[#232730] rounded-lg text-xs font-mono text-white focus:border-yellow-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Turso Auth Token
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0c0e12] border border-[#232730] rounded-lg text-xs font-mono text-white focus:border-yellow-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#232730] hover:bg-[#353b47] text-white font-bold rounded-lg text-xs flex items-center gap-1 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer les identifiants</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#232730] hover:bg-[#353b47] text-white font-medium rounded-lg text-xs transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
