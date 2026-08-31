import React from 'react'
import { Server, Check, X, Shield, Globe } from 'lucide-react'
import { DOFUS_SERVERS } from '../data/serversData'
import { DofusServer } from '../types'

interface ServerSelectModalProps {
  isOpen: boolean
  currentServer: string
  onClose: () => void
  onSelectServer: (serverId: string) => void
  isFirstVisit?: boolean
}

export const ServerSelectModal: React.FC<ServerSelectModalProps> = ({
  isOpen,
  currentServer,
  onClose,
  onSelectServer,
  isFirstVisit = false
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚔️</span>
              <h2 className="text-lg font-black text-white font-dofus">
                {isFirstVisit ? 'Bienvenue sur DofusCraft Ledger !' : 'Changer de Serveur'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sélectionnez votre serveur de jeu. Vos stocks, achats et prix HDV sont strictement isolés par serveur.
            </p>
          </div>

          {!isFirstVisit && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Server Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DOFUS_SERVERS.map((server) => {
            const isSelected = currentServer === server.id

            return (
              <button
                key={server.id}
                type="button"
                onClick={() => {
                  onSelectServer(server.id)
                  onClose()
                }}
                className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-yellow-500/10 border-yellow-500 ring-1 ring-yellow-500'
                    : 'bg-[#0d1117] border-[#30363d] hover:border-slate-500 hover:bg-[#21262d]/50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{server.icon}</span>
                    <span className="text-xs font-bold text-white">{server.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${server.badgeColor}`}>
                      {server.type === 'mono' ? 'Mono' : server.type === 'epic' ? 'Épique' : server.type === 'unity' ? 'Unity' : 'Multi'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    {server.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-slate-950 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Info footer */}
        <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] text-[11px] text-slate-400 flex items-center gap-2">
          <Globe className="w-4 h-4 text-yellow-400 shrink-0" />
          <span>
            Vous pourrez changer de serveur à tout moment depuis le menu en haut à droite.
          </span>
        </div>
      </div>
    </div>
  )
}
