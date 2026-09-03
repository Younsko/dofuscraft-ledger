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
  Download,
  ListPlus,
  ChevronDown
} from 'lucide-react'
import { formatKamasCompact } from '../utils/formatters'
import { DofusMetierLogo } from './DofusMetierLogo'
import { DOFUS_SERVERS } from '../data/serversData'
import { PriceDataSource } from '../types'

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
  priceDataSource?: PriceDataSource
  onTogglePriceDataSource?: () => void
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
  onGlobalSearchChange,
  priceDataSource = 'global',
  onTogglePriceDataSource
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

  // Pure clean text without emojis in tabs
  const tabs = [
    { id: 'fast-hdv' as const, label: 'Indexeur HDV', icon: ShoppingBag },
    { id: 'multi-craft' as const, label: 'Multi-Crafts', icon: ListPlus, badge: craftPlanCount > 0 ? `${craftPlanCount}` : null },
    { id: 'workshop' as const, label: 'Atelier', icon: Hammer },
    { id: 'inventory' as const, label: 'Inventaire', icon: Package, badge: stockCount > 0 ? `${stockCount}` : null },
    { id: 'hdv' as const, label: 'Achats', icon: ShoppingBag, badge: lotsCount > 0 ? `${lotsCount}` : null },
    { id: 'sales' as const, label: 'Ventes', icon: TrendingUp, badge: totalNetProfit !== 0 ? formatKamasCompact(totalNetProfit) : null },
    { id: 'encyclopedia' as const, label: 'Catalogue Marché', icon: BookOpen },
    { id: 'analytics' as const, label: 'Bilan', icon: BarChart3 }
  ]

  return (
    <header className="sticky top-0 z-40 bg-[#14171d] border-b border-[#232730]">
      {/* Top Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
          onClick={() => onSelectTab('fast-hdv')}
        >
          <DofusMetierLogo size={34} />
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold font-dofus tracking-wide text-white text-base">
                KAMA<span className="text-yellow-500">CRAFT</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#1b1f27] text-yellow-500 border border-[#2b313d] rounded">
                v3
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
              Indexeur HDV, Cours & Stock Dofus 3
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl mx-2 relative hidden md:block">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Rechercher un item, rune, ressource (ex: Gelano, Voile d'Encre)..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#0c0e12] border border-[#232730] rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-yellow-500 transition"
          />
        </div>

        {/* Right Controls: Price Mode Toggle, Server Switcher, Quick Action */}
        <div className="flex items-center gap-2">
          {/* Dofocus Global vs Local Price Mode Toggle */}
          {onTogglePriceDataSource && (
            <div className="flex items-center bg-[#0c0e12] p-0.5 rounded-lg border border-[#232730] text-[11px]">
              <button
                type="button"
                onClick={() => priceDataSource !== 'global' && onTogglePriceDataSource()}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  priceDataSource === 'global'
                    ? 'bg-[#232730] text-yellow-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Cours communautaires partagés (Dofocus) avec horodatage"
              >
                Global
              </button>
              <button
                type="button"
                onClick={() => priceDataSource !== 'local' && onTogglePriceDataSource()}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  priceDataSource === 'local'
                    ? 'bg-[#232730] text-yellow-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Uniquement vos relevés et achats personnels"
              >
                Local
              </button>
            </div>
          )}

          {/* Server Switcher */}
          <button
            type="button"
            onClick={onOpenServerModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0c0e12] hover:bg-[#1b1f27] border border-[#232730] hover:border-[#353b47] rounded-lg text-xs text-slate-200 transition"
            title="Changer de serveur"
          >
            <span className="font-bold text-white text-xs">{serverObj.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* PWA Install Button */}
          {canInstallPWA && (
            <button
              type="button"
              onClick={handleInstallPWA}
              className="px-2.5 py-1.5 bg-[#0c0e12] hover:bg-[#1b1f27] border border-[#232730] text-yellow-500 font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
              title="Installer l'application"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Installer</span>
            </button>
          )}

          {/* Quick HDV Add Button */}
          <button
            onClick={onOpenHDVModal}
            className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Achat HDV</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto pb-2 pt-0.5 scrollbar-none text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-yellow-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-[#1c2029]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-[#0c0e12] text-yellow-400 border border-[#232730]'
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
