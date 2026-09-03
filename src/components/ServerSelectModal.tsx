import React from 'react'
import { Server, Check, X, Globe } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#14171d] border border-[#232730] rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-dofus">
              {isFirstVisit ? 'Bienvenue sur KamaCraft' : 'Changer de Serveur'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sélectionnez votre serveur de jeu. Vos stocks, achats et prix HDV sont strictement isolés par serveur.
            </p>
          </div>

          {!isFirstVisit && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Server Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                className={`p-3 rounded-lg border text-left transition flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#1c2029] border-yellow-500'
                    : 'bg-[#0c0e12] border-[#232730] hover:border-[#353b47] hover:bg-[#14171d]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{server.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded border font-mono bg-[#1b1f27] border-[#2b313d] text-slate-300">
                      {server.type === 'mono' ? 'Mono' : server.type === 'epic' ? 'Épique' : server.type === 'unity' ? 'Unity' : 'Multi'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    {server.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-slate-950 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Info footer */}
        <div className="p-2.5 bg-[#0c0e12] rounded-lg border border-[#232730] text-[11px] text-slate-400 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
          <span>
            Les données de stock, achats et cours HDV sont enregistrées de façon permanente pour chaque serveur.
          </span>
        </div>
      </div>
    </div>
  )
}
