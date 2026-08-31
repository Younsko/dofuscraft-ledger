import { DofusServer } from '../types'

export const DOFUS_SERVERS: DofusServer[] = [
  {
    id: 'draconiros',
    name: 'Draconiros',
    type: 'mono',
    description: 'Serveur Mono-compte francophone. Économie dynamique et très active.',
    icon: '🛡️',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  {
    id: 'imagiro',
    name: 'Imagiro',
    type: 'multi',
    description: 'Serveur Multi-comptes francophone historique.',
    icon: '⚔️',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  {
    id: 'orukam',
    name: 'Orukam',
    type: 'multi',
    description: 'Serveur Multi-comptes francophone classique.',
    icon: '🏹',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  {
    id: 'talkasha',
    name: 'Tal Kasha',
    type: 'multi',
    description: 'Serveur Multi-comptes International (EN/ES/PT/FR).',
    icon: '🌍',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    id: 'ombre',
    name: 'Ombre',
    type: 'epic',
    description: 'Serveur Épique : Mort définitive en PvM, XP & Drop x3.',
    icon: '💀',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  {
    id: 'unity',
    name: 'Serveurs Unity / Pionniers',
    type: 'unity',
    description: 'Serveurs Nouvelle Génération Dofus Unity.',
    icon: '✨',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  }
]
