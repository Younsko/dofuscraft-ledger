import React from 'react'
import {
  Hammer,
  Package,
  ShoppingBag,
  TrendingUp,
  BookOpen,
  BarChart3,
  Plus,
  Coins,
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { formatKamas, formatKamasCompact } from '../utils/formatters'

import { DofusMetierLogo } from './DofusMetierLogo'

interface NavbarProps {
  activeTab: 'workshop' | 'fast-hdv' | 'inventory' | 'hdv' | 'sales' | 'encyclopedia' | 'analytics'
  onSelectTab: (tab: 'workshop' | 'fast-hdv' | 'inventory' | 'hdv' | 'sales' | 'encyclopedia' | 'analytics') => void
  onOpenHDVModal: () => void
  totalStockValue: number
  totalNetProfit: number
  stockCount: number
  lotsCount: number
  globalSearch: string
  onGlobalSearchChange: (q: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenHDVModal,
  totalStockValue,
  totalNetProfit,
  stockCount,
  lotsCount,
  globalSearch,
  onGlobalSearchChange
}) => {
  const tabs = [
    { id: 'fast-hdv' as const, label: '⚡ Indexeur HDV & OCR', icon: ShoppingBag, badge: 'Principal' },
    { id: 'workshop' as const, label: 'Atelier de Craft', icon: Hammer },
    { id: 'inventory' as const, label: 'Mon Stock / Coffre', icon: Package, badge: stockCount > 0 ? `${stockCount}` : null },
    { id: 'hdv' as const, label: 'Journal Achats', icon: ShoppingBag, badge: lotsCount > 0 ? `${lotsCount}` : null },
    { id: 'sales' as const, label: 'Ventes & Profits', icon: TrendingUp, badge: totalNetProfit !== 0 ? formatKamasCompact(totalNetProfit) : null },
    { id: 'encyclopedia' as const, label: 'Catalogue & Runes', icon: BookOpen },
    { id: 'analytics' as const, label: 'Bilan Financier', icon: BarChart3 }
  ]

  return (
    <header className="sticky top-0 z-40 bg-[#161b22] border-b border-[#30363d] shadow-sm">
      {/* Top Navbar Row (YouTube / Vinted Header) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Logo with Dofus Metier Emblem */}
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

        {/* Center: Prominent Global Search Bar (like YouTube / Vinted) */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => {
                onGlobalSearchChange(e.target.value)
                if (activeTab !== 'encyclopedia' && activeTab !== 'workshop') {
                  onSelectTab('encyclopedia')
                }
              }}
              placeholder="Rechercher un item, rune Trans, ressource, recette... (ex: Gelano, Voile, Trans Do So)"
              className="w-full pl-10 pr-9 py-2 bg-[#0d1117] border border-[#30363d] hover:border-slate-500 focus:border-yellow-500 rounded-full text-sm text-slate-100 placeholder-slate-500 outline-none transition"
            />
            {globalSearch && (
              <button
                onClick={() => onGlobalSearchChange('')}
                className="absolute right-3 p-0.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Balance & Quick Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-3 bg-[#0d1117] px-3 py-1.5 rounded-full border border-[#30363d]">
            <div className="flex items-center gap-1.5 text-xs">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-slate-400 text-[11px]">Stock :</span>
              <span className="font-mono font-bold text-yellow-400">
                {formatKamas(totalStockValue)}
              </span>
            </div>

            {totalNetProfit !== 0 && (
              <>
                <div className="h-3.5 w-px bg-[#30363d]" />
                <div className="text-xs font-mono font-bold">
                  <span className={totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {totalNetProfit >= 0 ? '+' : ''}{formatKamasCompact(totalNetProfit)}
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onOpenHDVModal}
            className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-slate-950 font-bold rounded-full text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Achat HDV</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#21262d]">
        <nav className="flex space-x-2 overflow-x-auto py-1.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#21262d] text-yellow-400 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#21262d]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-yellow-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-yellow-400 text-slate-950 font-bold'
                        : 'bg-[#30363d] text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
