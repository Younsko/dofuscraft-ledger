import React, { useState } from 'react'
import { Cloud, Check, X, RefreshCw, Database, ExternalLink } from 'lucide-react'
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

  if (!isOpen) return null

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = tursoService.saveConfig(urlInput, tokenInput)
    setIsConfigured(success)

    if (success) {
      setSyncStatusMessage('Connexion à Turso réussie ! Initialisation...')
      setIsSyncing(true)
      marketSyncService.initServerSync(currentServer)
      const count = await marketSyncService.syncFromCloud(currentServer)
      setIsSyncing(false)
      setSyncStatusMessage(`Connecté avec succès ! ${count} cours synchronisés depuis le Cloud.`)
      if (onSyncComplete) onSyncComplete(count)
    } else {
      setSyncStatusMessage('Veuillez renseigner une URL de base Turso et un Token valides.')
    }
  }

  const handleManualSyncNow = async () => {
    setIsSyncing(true)
    setSyncStatusMessage('Synchronisation des cours depuis Turso...')
    const count = await marketSyncService.syncFromCloud(currentServer)
    setIsSyncing(false)
    setSyncStatusMessage(`${count} cours actualisés depuis Turso !`)
    if (onSyncComplete) onSyncComplete(count)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#14171d] border border-[#232730] rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-2 border-b border-[#232730]">
          <div className="flex items-center gap-2">
            <Cloud className={`w-5 h-5 ${isConfigured ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div>
              <h2 className="text-base font-bold text-white font-dofus">
                Synchronisation Cloud Communautaire (Turso)
              </h2>
              <p className="text-xs text-slate-400">
                Partagez et recevez les cours HDV en direct avec tous les joueurs de votre serveur.
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

        {/* Current Status Pill */}
        <div className="p-3 bg-[#0c0e12] rounded-lg border border-[#232730] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className="font-semibold text-white">
              {isConfigured ? 'Cloud Turso Connecté' : 'Mode Local (Non connecté au Cloud)'}
            </span>
            <span className="text-slate-400 font-mono">• Serveur : {currentServer}</span>
          </div>

          {isConfigured && (
            <button
              type="button"
              onClick={handleManualSyncNow}
              disabled={isSyncing}
              className="px-2.5 py-1 bg-[#232730] hover:bg-[#353b47] text-yellow-400 text-xs font-semibold rounded flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          )}
        </div>

        {syncStatusMessage && (
          <div className="p-2.5 bg-[#1b221d] border border-[#263c2c] text-emerald-300 rounded-lg text-xs font-medium">
            {syncStatusMessage}
          </div>
        )}

        {/* Turso Advantages & Setup */}
        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 bg-[#0c0e12] rounded-lg border border-[#232730] space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-yellow-400" />
              Pourquoi Turso ?
            </h4>
            <ul className="space-y-1 text-slate-400 list-disc pl-4 text-[11px]">
              <li><strong>500 bases de données gratuites</strong> (pas de limite à 2 projets).</li>
              <li><strong>Ne se met JAMAIS en pause</strong> (reste allumé 24h/24, 365j/an).</li>
              <li><strong>Création de table 100% automatique</strong> : vous n'avez aucun script SQL à taper, KamaCraft initialise la table tout seul.</li>
            </ul>

            <div className="pt-1.5 border-t border-[#1f242e] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Créer une base gratuite sur Turso :</span>
              <a
                href="https://turso.tech"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-[#232730] hover:bg-[#353b47] text-yellow-400 font-medium rounded text-[11px] flex items-center gap-1 transition"
              >
                <span>Ouvrir Turso.tech</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveConfig} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Turso Database URL
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="libsql://kamacraft-votrecompte.turso.io"
                className="w-full px-3 py-1.5 bg-[#0c0e12] border border-[#232730] rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:border-yellow-500 outline-none"
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
                placeholder="eyJhbGciOiJFZERTQSI..."
                className="w-full px-3 py-1.5 bg-[#0c0e12] border border-[#232730] rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:border-yellow-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Fermer
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Enregistrer & Activer Turso</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
