import React, { useState, useEffect, useRef } from 'react'
import { X, Search, Plus, Sparkles, Check, PackagePlus, ArrowRight } from 'lucide-react'
import { DofusItem, PurchaseBatch } from '../types'
import { searchDofusItems } from '../services/dofusApi'
import { KamaInput } from './KamaInput'
import { formatKamas } from '../utils/formatters'

interface HDVPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onAddBatch: (batch: Omit<PurchaseBatch, 'id' | 'remaining_quantity'>) => void
  preselectedItem?: DofusItem | null
}

export const HDVPurchaseModal: React.FC<HDVPurchaseModalProps> = ({
  isOpen,
  onClose,
  onAddBatch,
  preselectedItem
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DofusItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DofusItem | null>(preselectedItem || null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [quantity, setQuantity] = useState<number>(100)
  const [pricingMode, setPricingMode] = useState<'total' | 'unit'>('total')
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [unitPrice, setUnitPrice] = useState<number>(0)
  const [note, setNote] = useState<string>('')
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItem(preselectedItem)
    }
  }, [preselectedItem])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Search effect
  useEffect(() => {
    let active = true
    const handleSearch = async () => {
      setIsLoading(true)
      const cat = categoryFilter === 'all' ? undefined : categoryFilter
      const items = await searchDofusItems(searchQuery, cat)
      if (active) {
        setSearchResults(items)
        setIsLoading(false)
      }
    }

    const timer = setTimeout(handleSearch, 200)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery, categoryFilter])

  // Sync pricing modes
  const handleTotalChange = (tot: number) => {
    setTotalPrice(tot)
    if (quantity > 0) {
      setUnitPrice(Math.round(tot / quantity))
    }
  }

  const handleUnitChange = (unit: number) => {
    setUnitPrice(unit)
    setTotalPrice(unit * quantity)
  }

  const handleQuantityChange = (qty: number) => {
    const validQty = Math.max(1, qty)
    setQuantity(validQty)
    if (pricingMode === 'total') {
      if (totalPrice > 0) {
        setUnitPrice(Math.round(totalPrice / validQty))
      }
    } else {
      setTotalPrice(unitPrice * validQty)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || quantity <= 0 || totalPrice <= 0) return

    const calculatedUnitPrice = Math.round(totalPrice / quantity)

    onAddBatch({
      item_ankama_id: selectedItem.ankama_id,
      item_name: selectedItem.name,
      item_type: selectedItem.type?.name || 'Ressource',
      item_icon: selectedItem.image_urls?.icon || `https://api.dofusdu.de/dofus3/v1/img/item/${selectedItem.ankama_id}-64.png`,
      item_level: selectedItem.level || 1,
      category: selectedItem.category || 'resources',
      quantity,
      total_price: totalPrice,
      unit_price: calculatedUnitPrice,
      date: new Date().toISOString(),
      note: note.trim() || undefined
    })

    setSuccessToast(`+${quantity}x ${selectedItem.name} ajouté(s) au stock !`)
    setTimeout(() => {
      setSuccessToast(null)
      onClose()
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-dofus">
                Indexer un Achat HDV
              </h2>
              <p className="text-xs text-slate-400">
                Enregistrez vos ressources, runes ou items achetés pour enrichir votre stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Step 1: Select Item */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300/80 mb-2">
              1. Sélectionner l'Item ou la Rune
            </label>

            {selectedItem ? (
              <div className="flex items-center justify-between p-3.5 bg-slate-800/90 border border-amber-500/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 bg-slate-950/80 rounded-lg border border-amber-500/30 flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedItem.image_urls?.icon}
                      alt={selectedItem.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{selectedItem.name}</span>
                      <span className="text-[11px] px-2 py-0.5 bg-slate-700 text-amber-300 rounded font-mono">
                        Niv. {selectedItem.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{selectedItem.type?.name || 'Ressource'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une ressource, rune (Trans Do So, Ga Pâ...), équipement..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 hover:border-slate-600 focus:border-amber-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 transition outline-none"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: 'Tout' },
                    { id: 'resources', label: '🌿 Ressources' },
                    { id: 'runes', label: '🔮 Runes FM & Trans' },
                    { id: 'equipment', label: '⚔️ Équipements' },
                    { id: 'consumables', label: '🧪 Consommables' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategoryFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                        categoryFilter === tab.id
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-medium'
                          : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Results List */}
                <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-950/50 rounded-xl p-1.5 border border-slate-800">
                  {isLoading ? (
                    <div className="p-4 text-center text-xs text-slate-400">Recherche dans Dofus 3...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <button
                        key={item.ankama_id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="w-full flex items-center justify-between p-2 hover:bg-slate-800/80 rounded-lg text-left transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.image_urls?.icon}
                            alt={item.name}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                            }}
                          />
                          <div>
                            <p className="text-xs font-medium text-slate-200 group-hover:text-amber-300 transition">
                              {item.name}
                            </p>
                            <span className="text-[10px] text-slate-500">
                              {item.type?.name} • Niv. {item.level}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Aucun item trouvé. Tapez un nom (ex: "Gelée", "Trans", "Laine").
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Quantity and Price */}
          {selectedItem && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800">
              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300/80 mb-1.5">
                  2. Quantité achetée
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-32 px-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg text-slate-100 font-mono text-sm"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[1, 10, 50, 100, 500, 1000].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuantityChange(q)}
                        className={`px-2 py-1 text-xs font-mono rounded border transition ${
                          quantity === q
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        x{q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Mode Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
                    3. Prix d'achat HDV
                  </label>
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setPricingMode('total')}
                      className={`px-2.5 py-0.5 rounded-md transition ${
                        pricingMode === 'total'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Prix Total du Lot
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode('unit')}
                      className={`px-2.5 py-0.5 rounded-md transition ${
                        pricingMode === 'unit'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Prix Unitaire (u)
                    </button>
                  </div>
                </div>

                {pricingMode === 'total' ? (
                  <KamaInput
                    value={totalPrice}
                    onChange={handleTotalChange}
                    label={`Prix total payé pour les ${quantity}x`}
                    placeholder="Ex: 1m, 350k, 1 500 000..."
                  />
                ) : (
                  <KamaInput
                    value={unitPrice}
                    onChange={handleUnitChange}
                    label="Prix unitaire à l'unité"
                    placeholder="Ex: 10k, 1 500..."
                  />
                )}
              </div>

              {/* Real-time PRU summary */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">Coût unitaire calculé (PRU du lot) :</span>
                  <p className="text-sm font-bold font-mono text-amber-400">
                    {formatKamas(quantity > 0 ? Math.round(totalPrice / quantity) : 0)} / unité
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400">Total investi :</span>
                  <p className="text-sm font-bold font-mono text-amber-300">
                    {formatKamas(totalPrice)}
                  </p>
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Note / Origine (Optionnel)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: HDV Bonta, Achat en guilde, Lot x100..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={totalPrice <= 0 || quantity <= 0}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
              >
                {successToast ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>{successToast}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Ajouter {quantity}x au Coffre / Stock</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
