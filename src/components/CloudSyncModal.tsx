import React, { useState } from 'react'
import { Cloud, Check, Copy, X, RefreshCw, Database } from 'lucide-react'
import { supabaseService } from '../services/supabaseService'
import { marketSyncService } from '../services/marketSyncService'

interface CloudSyncModalProps {
  isOpen: boolean
  onClose: () => void
  currentServer: string
  onSyncComplete?: (count: number) => void
}

const SUPABASE_SQL_SETUP = `-- 1. Table des cours HDV partagés KamaCraft
create table if not exists public.market_prices (
  server_id text not null,
  item_ankama_id bigint not null,
  price bigint not null,
  item_name text,
  updated_at timestamptz default now(),
  source text default 'community',
  author text default 'Artisan',
  primary key (server_id, item_ankama_id)
);

-- 2. Activer la sécurité RLS
alter table public.market_prices enable row level security;

-- 3. Politique d'accès public en lecture et écriture
create policy "Accès public KamaCraft"
on public.market_prices
for all
using (true)
with check (true);

-- 4. Activer la synchronisation en temps réel (Realtime)
alter publication supabase_realtime add table public.market_prices;
`

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentServer,
  onSyncComplete
}) => {
  const [urlInput, setUrlInput] = useState(supabaseService.getSupabaseUrl())
  const [keyInput, setKeyInput] = useState(supabaseService.getSupabaseKey())
  const [copiedSql, setCopiedSql] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(supabaseService.isConfigured())

  if (!isOpen) return null

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = supabaseService.saveConfig(urlInput, keyInput)
    setIsConfigured(success)

    if (success) {
      setSyncStatusMessage('Configuration validée ! Synchronisation en cours...')
      setIsSyncing(true)
      marketSyncService.initServerSync(currentServer)
      const count = await marketSyncService.syncFromCloud(currentServer)
      setIsSyncing(false)
      setSyncStatusMessage(`Synchronisation réussie (${count} cours récupérés)`)
      if (onSyncComplete) onSyncComplete(count)
    } else {
      setSyncStatusMessage('Veuillez renseigner une URL et une clé valides.')
    }
  }

  const handleManualSyncNow = async () => {
    setIsSyncing(true)
    setSyncStatusMessage('Synchronisation des cours depuis le Cloud...')
    const count = await marketSyncService.syncFromCloud(currentServer)
    setIsSyncing(false)
    setSyncStatusMessage(`${count} cours actualisés depuis le Cloud !`)
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
                Synchronisation Cloud Communautaire
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
              {isConfigured ? 'Cloud Supabase Actif' : 'Mode Local (Non connecté au Cloud)'}
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
              <span>Synchroniser</span>
            </button>
          )}
        </div>

        {syncStatusMessage && (
          <div className="p-2.5 bg-[#1b221d] border border-[#263c2c] text-emerald-300 rounded-lg text-xs font-medium">
            {syncStatusMessage}
          </div>
        )}

        {/* Setup Guide */}
        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 bg-[#0c0e12] rounded-lg border border-[#232730] space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-yellow-400" />
              Configuration en 2 minutes (100% Gratuit)
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
              <li>Créez un projet gratuit sur <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-yellow-400 underline font-semibold">supabase.com</a>.</li>
              <li>Allez dans le menu <strong>SQL Editor</strong> et collez le script ci-dessous :</li>
            </ol>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-mono">Script SQL de la table KamaCraft</span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-2.5 py-1 bg-[#232730] hover:bg-[#353b47] text-white font-medium rounded text-[11px] flex items-center gap-1 transition"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-300" />}
                <span>{copiedSql ? 'Copié !' : 'Copier le script SQL'}</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveConfig} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-1.5 bg-[#0c0e12] border border-[#232730] rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:border-yellow-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
                <span>Enregistrer & Activer le Cloud</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
