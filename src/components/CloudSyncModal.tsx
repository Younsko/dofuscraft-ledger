import React, { useState } from 'react'
import { Cloud, Check, X, RefreshCw, ShieldCheck } from 'lucide-react'
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
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleManualSyncNow = async () => {
    setIsSyncing(true)
    setSyncStatusMessage('Synchronisation des cours en direct...')
    const count = await marketSyncService.syncFromCloud(currentServer)
    setIsSyncing(false)
    setSyncStatusMessage(`${count} cours actualisés avec succès !`)
    if (onSyncComplete) onSyncComplete(count)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#14171d] border border-[#232730] rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#232730]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-dofus flex items-center gap-2">
                <span>Réseau Cloud KamaCraft</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded">
                  ACTIF
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Partage en direct des cours HDV entre artisans.
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

        {/* Status Card */}
        <div className="p-4 bg-[#0c0e12] rounded-xl border border-[#232730] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">
                Connecté au serveur {currentServer.toUpperCase()}
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualSyncNow}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Vos scans OCR et saisies HDV sont automatiquement enregistrés et synchronisés avec tous les joueurs de votre serveur.
            </span>
          </div>
        </div>

        {syncStatusMessage && (
          <div className="p-2.5 bg-[#122319] border border-[#1e462d] text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{syncStatusMessage}</span>
          </div>
        )}

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
