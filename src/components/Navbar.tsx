import React, { useState, useEffect } from 'react'
import {
  Hammer,
  Package,
  ShoppingBag,
  TrendingUp,
  BookOpen,
  BarChart3,
  Search,
  Plus,
  Server,
  Download,
  ListPlus,
  ChevronDown
} from 'lucide-react'
import { formatKamas, formatKamasCompact } from '../utils/formatters'
import { DofusMetierLogo } from './DofusMetierLogo'
import { DOFUS_SERVERS } from '../data/serversData'

interface NavbarProps {
  activeTab: 'workshop' | 'fast-hdv' | 'multi-craft' | 'inventory' | 'hdv' | 'sales' | 'encyclopedia' | 'analytics'
  onSelectTab: (tab: 'workshop' | 'fast-hdv' | 'multi-craft' | 'inventory' | 'hdv' | 'sales' | 'encyclopedia' | 'analytics') => void
  onOpenHDVModal: () => void
  onOpenServerModal: () => void
  currentServer: string
  totalStockValue: number
  totalNetProfit: number
  stockCount: number
  lotsCount: number
  craftPlanCount: number
  globalSearch: string
  onGlobalSearchChange: (q: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenHDVModal,
  onOpenServerModal,
  currentServer,
  totalStockValue,
  totalNetProfit,
  stockCount,
  lotsCount,
  craftPlanCount,
  globalSearch,
  onGlobalSearchChange
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [canInstallPWA, setCanInstallPWA] = useState(false)

  const serverObj = DOFUS_SERVERS.find(s => s.id === currentServer) || DOFUS_SERVERS[0]

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstallPWA(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setCanInstallPWA(false)
    }
    setDeferredPrompt(null)
  }

  const tabs = [
    { id: 'fast-hdv' as const, label: '⚡ Indexeur HDV & OCR', icon: ShoppingBag, badge: 'Principal' },
    { id: 'multi-craft' as const, label: '📋 Multi-Crafts & Courses', icon: ListPlus, badge: craftPlanCount > 0 ? `${craftPlanCount}` : null },
    { id: 'workshop' as const, label: 'Atelier de Craft', icon: Hammer },
    { id: 'inventory' as const, label: 'Mon Stock / Coffre', icon: Package, badge: stockCount > 0 ? `${stockCount}` : null },
    { id: 'hdv' as const, label: 'Journal Achats', icon: ShoppingBag, badge: lotsCount > 0 ? `${lotsCount}` : null },
    { id: 'sales' as const, label: 'Ventes & Profits', icon: TrendingUp, badge: totalNetProfit !== 0 ? formatKamasCompact(totalNetProfit) : null },
    { id: 'encyclopedia' as const, label: 'Catalogue & Runes', icon: BookOpen },
    { id: 'analytics' as const, label: 'Bilan Financier', icon: BarChart3 }
  ]

  return (
    <header className="sticky top-0 z-40 bg-[#161b22] border-b border-[#30363d] shadow-sm">
      {/* Top Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
          onClick={() => onSelectTab('fast-hdv')}
        >
          <DofusMetierLogo size={36} />
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold font-dofus tracking-wide text-white text-base">
                DOFUS<span className="text-yellow-400">CRAFT</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#21262d] text-yellow-400 border border-[#30363d] rounded">
                v3
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
              Indexeur HDV, Métiers & Stock
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl mx-2 relative hidden md:block">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Rechercher une ressource, rune, équipement (ex: Trans Do So, Voile d'Encre)..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-full text-xs text-white placeholder-slate-500 outline-none focus:border-yellow-500 transition shadow-inner"
          />
        </div>

        {/* Right Controls: Server Switcher, PWA Install & Quick Action */}
        <div className="flex items-center gap-2">
          {/* Server Switcher Pill */}
          <button
            type="button"
            onClick={onOpenServerModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-yellow-500 rounded-xl text-xs text-slate-200 transition"
            title="Changer de serveur de jeu"
          >
            <span>{serverObj.icon}</span>
            <span className="font-bold text-white hidden sm:inline">{serverObj.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* PWA Install Button */}
          {canInstallPWA && (
            <button
              type="button"
              onClick={handleInstallPWA}
              className="px-2.5 py-1.5 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-yellow-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              title="Installer l'application sur le bureau / mobile"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Installer App</span>
            </button>
          )}

          {/* Quick HDV Add Button */}
          <button
            onClick={onOpenHDVModal}
            className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Achat HDV</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-yellow-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-[#0d1117] text-yellow-400 border border-[#30363d]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </header>
  )
}
