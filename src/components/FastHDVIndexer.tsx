import React, { useState, useEffect, useRef } from 'react'
import {
  Zap,
  Camera,
  FileText,
  Search,
  Plus,
  Trash2,
  Check,
  Upload,
  Coins,
  Sparkles,
  Layers,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  LayoutGrid,
  Grid3X3,
  List,
  ChevronRight,
  Filter
} from 'lucide-react'
import { DofusItem, PurchaseBatch } from '../types'
import { searchDofusItems, getPreloadedCatalog } from '../services/dofusApi'
import { parseDofusChatText, performOCROnImage } from '../services/dofusChatParser'
import { formatKamas, parseKamaInput } from '../utils/formatters'

interface FastHDVIndexerProps {
  onAddMultipleBatches: (batches: Array<Omit<PurchaseBatch, 'id' | 'remaining_quantity'>>) => void
  onAddSingleBatch: (batch: Omit<PurchaseBatch, 'id' | 'remaining_quantity'>) => void
}

interface IndexerRow {
  id: string
  item: DofusItem
  quantity: number
  priceMode: 'total' | 'unit'
  priceInput: string
  totalPrice: number
  unitPrice: number
  note?: string
}

export const FastHDVIndexer: React.FC<FastHDVIndexerProps> = ({
  onAddMultipleBatches,
  onAddSingleBatch
}) => {
  // Preloaded left catalog & filters
  const [catalogItems, setCatalogItems] = useState<DofusItem[]>([])
  const [catalogCategory, setCatalogCategory] = useState<string>('resources')
  const [catalogSearch, setCatalogSearch] = useState<string>('')
  const [minLevel, setMinLevel] = useState<number>(1)
  const [maxLevel, setMaxLevel] = useState<number>(200)
  const [gridSize, setGridSize] = useState<'compact' | 'medium' | 'large'>('compact')
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)

  // Active Multi-row Table
  const [rows, setRows] = useState<IndexerRow[]>([])

  // OCR & Text Mode
  const [inputMode, setInputMode] = useState<'grid' | 'ocr' | 'chat'>('grid')
  const [isOCRProcessing, setIsOCRProcessing] = useState(false)
  const [chatTextInput, setChatTextInput] = useState('')
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load catalog items dynamically with memoization
  useEffect(() => {
    let active = true
    const load = async () => {
      setIsLoadingCatalog(true)
      const cat = catalogCategory === 'all' ? undefined : catalogCategory
      const items = await searchDofusItems(catalogSearch, cat, minLevel, maxLevel)
      if (active) {
        setCatalogItems(items)
        setIsLoadingCatalog(false)
      }
    }
    const timer = setTimeout(load, 120)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [catalogCategory, catalogSearch, minLevel, maxLevel])

  // Paste screenshot handler (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0]
        if (file.type.startsWith('image/')) {
          e.preventDefault()
          handleProcessOCR(file)
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  // Add item from catalog to active table
  const handleAddItemToRows = (item: DofusItem, defaultQty = 100) => {
    setRows(prev => {
      const existingIdx = prev.findIndex(r => r.item.ankama_id === item.ankama_id)
      if (existingIdx >= 0) {
        const updated = [...prev]
        const current = updated[existingIdx]
        const newQty = current.quantity + defaultQty
        const newTotal = current.priceMode === 'unit' ? current.unitPrice * newQty : current.totalPrice
        const newUnit = current.priceMode === 'total' && newQty > 0 ? Math.round(newTotal / newQty) : current.unitPrice

        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          totalPrice: newTotal,
          unitPrice: newUnit
        }
        return updated
      }

      const newRow: IndexerRow = {
        id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        item,
        quantity: defaultQty,
        priceMode: 'total',
        priceInput: '',
        totalPrice: 0,
        unitPrice: 0
      }
      return [newRow, ...prev]
    })
  }

  // Update row
  const updateRow = (rowId: string, updates: Partial<IndexerRow>) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r

      const merged = { ...r, ...updates }

      if (updates.priceInput !== undefined) {
        const parsed = parseKamaInput(updates.priceInput)
        if (merged.priceMode === 'total') {
          merged.totalPrice = parsed
          merged.unitPrice = merged.quantity > 0 ? Math.round(parsed / merged.quantity) : 0
        } else {
          merged.unitPrice = parsed
          merged.totalPrice = parsed * merged.quantity
        }
      } else if (updates.quantity !== undefined) {
        const qty = Math.max(1, updates.quantity)
        merged.quantity = qty
        if (merged.priceMode === 'total') {
          merged.unitPrice = qty > 0 ? Math.round(merged.totalPrice / qty) : 0
        } else {
          merged.totalPrice = merged.unitPrice * qty
        }
      } else if (updates.priceMode !== undefined) {
        if (updates.priceMode === 'total') {
          merged.priceInput = merged.totalPrice > 0 ? merged.totalPrice.toString() : ''
        } else {
          merged.priceInput = merged.unitPrice > 0 ? merged.unitPrice.toString() : ''
        }
      }

      return merged
    }))
  }

  const removeRow = (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
  }

  // Process OCR image
  const handleProcessOCR = async (file: File | Blob) => {
    setIsOCRProcessing(true)
    setOcrError(null)

    try {
      const res = await performOCROnImage(file)

      if (res.lines.length === 0) {
        setOcrError("Aucun achat détecté dans l'image. Assurez-vous que les messages du chat Dofus sont bien visibles.")
      } else {
        const newRows: IndexerRow[] = res.lines.map(line => ({
          id: `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          item: line.matchedItem || {
            ankama_id: 0,
            name: line.itemName,
            type: { id: 0, name: 'Ressource' },
            level: 1,
            image_urls: { icon: 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png' },
            category: 'resources'
          },
          quantity: line.quantity,
          priceMode: 'total',
          priceInput: line.totalPrice.toString(),
          totalPrice: line.totalPrice,
          unitPrice: line.unitPrice,
          note: 'Import OCR Chat'
        }))

        setRows(prev => [...newRows, ...prev])
        setInputMode('grid')
        setSuccessToast(`+${res.lines.length} achats détectés par OCR !`)
        setTimeout(() => setSuccessToast(null), 2500)
      }
    } catch (err: any) {
      console.error(err)
      setOcrError("Erreur lors de l'analyse OCR. Réessayez avec une capture plus nette.")
    } finally {
      setIsOCRProcessing(false)
    }
  }

  // Process pasted chat text
  const handleProcessChatText = async () => {
    if (!chatTextInput.trim()) return

    const parsedLines = await parseDofusChatText(chatTextInput)
    if (parsedLines.length === 0) {
      setOcrError("Aucun format d'achat reconnu dans le texte collé.")
      return
    }

    const newRows: IndexerRow[] = parsedLines.map(line => ({
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      item: line.matchedItem || {
        ankama_id: 0,
        name: line.itemName,
        type: { id: 0, name: 'Ressource' },
        level: 1,
        image_urls: { icon: 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png' },
        category: 'resources'
      },
      quantity: line.quantity,
      priceMode: 'total',
      priceInput: line.totalPrice.toString(),
      totalPrice: line.totalPrice,
      unitPrice: line.unitPrice,
      note: 'Import Chat Dofus'
    }))

    setRows(prev => [...newRows, ...prev])
    setChatTextInput('')
    setInputMode('grid')
    setSuccessToast(`+${parsedLines.length} achats ajoutés depuis le chat !`)
    setTimeout(() => setSuccessToast(null), 2500)
  }

  // Commit all rows
  const handleCommitAll = () => {
    const validRows = rows.filter(r => r.totalPrice > 0 && r.quantity > 0)
    if (validRows.length === 0) return

    const batchesToAdd = validRows.map(r => ({
      item_ankama_id: r.item.ankama_id,
      item_name: r.item.name,
      item_type: r.item.type?.name || 'Ressource',
      item_icon: r.item.image_urls?.icon || `https://api.dofusdu.de/dofus3/v1/img/item/${r.item.ankama_id}-64.png`,
      item_level: r.item.level || 1,
      category: r.item.category || 'resources',
      quantity: r.quantity,
      total_price: r.totalPrice,
      unit_price: r.unitPrice,
      date: new Date().toISOString(),
      note: r.note
    }))

    onAddMultipleBatches(batchesToAdd)
    setRows([])
    setSuccessToast(`🎉 ${batchesToAdd.length} lots indexés avec succès dans votre stock !`)
    setTimeout(() => setSuccessToast(null), 3000)
  }

  const totalBatchKamas = rows.reduce((acc, r) => acc + r.totalPrice, 0)
  const totalBatchUnits = rows.reduce((acc, r) => acc + r.quantity, 0)

  // Level presets
  const applyLevelPreset = (min: number, max: number) => {
    setMinLevel(min)
    setMaxLevel(max)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner with Mode Selector */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Indexeur HDV Rapide & OCR Dofus
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cliquez sur les items de la grille ou collez votre capture d'écran de chat (<kbd className="px-1.5 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-[10px] text-yellow-400 font-bold">Ctrl+V</kbd>).
          </p>
        </div>

        {/* Input Mode Selector */}
        <div className="flex bg-[#0d1117] p-1 rounded-xl border border-[#30363d] text-xs">
          <button
            onClick={() => setInputMode('grid')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              inputMode === 'grid' ? 'bg-yellow-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tableur Panier ({rows.length})</span>
          </button>

          <button
            onClick={() => setInputMode('ocr')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              inputMode === 'ocr' ? 'bg-yellow-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Screen Chat OCR</span>
          </button>

          <button
            onClick={() => setInputMode('chat')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              inputMode === 'chat' ? 'bg-yellow-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Texte Chat</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-1">
          <span>{successToast}</span>
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* Split Screen: Left Preloaded Catalog Grid | Right Multi-Row Panier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 cols): High-Density Preloaded Catalog */}
        <div className="lg:col-span-5 bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5 space-y-3 flex flex-col max-h-[780px]">
          {/* Header & Category Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-yellow-400" />
                Catalogue Préchargé
              </span>

              {/* Grid Density Switcher */}
              <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setGridSize('compact')}
                  className={`p-1 rounded ${gridSize === 'compact' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  title="Grille compacte (Dense)"
                >
                  <Grid3X3 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize('medium')}
                  className={`p-1 rounded ${gridSize === 'medium' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  title="Grille moyenne"
                >
                  <LayoutGrid className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize('large')}
                  className={`p-1 rounded ${gridSize === 'large' ? 'bg-yellow-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  title="Vue liste détaillée"
                >
                  <List className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Rechercher par nom (ex: Gelée, Pain, Trans...)"
                className="w-full pl-8 pr-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-yellow-500"
              />
            </div>

            {/* Category Pills (Resources, Runes, Consumables, Equipment) */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {[
                { id: 'resources', label: '🌿 Ressources' },
                { id: 'runes', label: '🔮 Runes FM' },
                { id: 'consumables', label: '🧪 Consommables' },
                { id: 'equipment', label: '⚔️ Équipements' },
                { id: 'all', label: 'Tout' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setCatalogCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                    catalogCategory === c.id
                      ? 'bg-yellow-400 text-slate-950'
                      : 'bg-[#21262d] text-slate-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Interactive Level Slider & Presets */}
            <div className="bg-[#0d1117] p-2 rounded-xl border border-[#30363d] space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <SlidersHorizontal className="w-3 h-3 text-yellow-400" />
                  Niveau : <strong className="text-yellow-400 font-mono">{minLevel} - {maxLevel}</strong>
                </span>
                <div className="flex gap-1 text-[10px]">
                  <button
                    onClick={() => applyLevelPreset(1, 200)}
                    className="px-1.5 py-0.5 bg-[#161b22] hover:bg-[#21262d] text-slate-300 rounded"
                  >
                    1-200
                  </button>
                  <button
                    onClick={() => applyLevelPreset(1, 100)}
                    className="px-1.5 py-0.5 bg-[#161b22] hover:bg-[#21262d] text-slate-300 rounded"
                  >
                    1-100
                  </button>
                  <button
                    onClick={() => applyLevelPreset(100, 199)}
                    className="px-1.5 py-0.5 bg-[#161b22] hover:bg-[#21262d] text-slate-300 rounded"
                  >
                    100-199
                  </button>
                  <button
                    onClick={() => applyLevelPreset(200, 200)}
                    className="px-1.5 py-0.5 bg-[#161b22] hover:bg-[#21262d] text-yellow-400 font-bold rounded"
                  >
                    200
                  </button>
                </div>
              </div>

              {/* Slider Input */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={maxLevel}
                  onChange={(e) => setMaxLevel(parseInt(e.target.value) || 200)}
                  className="w-full accent-yellow-400 cursor-pointer h-1.5 bg-[#21262d] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Item Grid Listing */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
            {isLoadingCatalog ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-yellow-500" />
                Chargement des items...
              </div>
            ) : catalogItems.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                Aucun item pour ce filtre (Niv. {minLevel}-{maxLevel}).
              </div>
            ) : gridSize === 'compact' ? (
              /* Compact Dense Grid (3 columns) */
              <div className="grid grid-cols-3 gap-1.5">
                {catalogItems.map((item) => (
                  <button
                    key={item.ankama_id}
                    type="button"
                    onClick={() => handleAddItemToRows(item, 100)}
                    className="p-1.5 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-yellow-500 rounded-xl flex flex-col items-center text-center transition group active:scale-95"
                    title={`${item.name} (Niv. ${item.level}) - Cliquer pour ajouter`}
                  >
                    <img
                      src={item.image_urls?.icon}
                      alt={item.name}
                      className="w-8 h-8 object-contain group-hover:scale-110 transition"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                      }}
                    />
                    <p className="text-[10px] font-bold text-white group-hover:text-yellow-400 truncate w-full mt-1">
                      {item.name}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono">
                      Niv.{item.level}
                    </span>
                  </button>
                ))}
              </div>
            ) : gridSize === 'medium' ? (
              /* Medium Grid (2 columns) */
              <div className="grid grid-cols-2 gap-1.5">
                {catalogItems.map((item) => (
                  <button
                    key={item.ankama_id}
                    type="button"
                    onClick={() => handleAddItemToRows(item, 100)}
                    className="p-2 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-yellow-500 rounded-xl flex items-center gap-2 text-left transition group active:scale-98"
                  >
                    <img
                      src={item.image_urls?.icon}
                      alt={item.name}
                      className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition"
                    />
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-white group-hover:text-yellow-400 truncate">
                        {item.name}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate">
                        {item.type?.name} • Niv.{item.level}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Detailed List View */
              <div className="space-y-1">
                {catalogItems.map((item) => (
                  <button
                    key={item.ankama_id}
                    type="button"
                    onClick={() => handleAddItemToRows(item, 100)}
                    className="w-full p-2 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-yellow-500 rounded-xl flex items-center justify-between text-left transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={item.image_urls?.icon} alt={item.name} className="w-7 h-7 object-contain" />
                      <div>
                        <span className="text-xs font-bold text-white group-hover:text-yellow-400">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          {item.type?.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-yellow-400 bg-[#161b22] px-2 py-0.5 rounded">
                      Niv.{item.level}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Panier / Tableur Multi-lignes / OCR */}
        <div className="lg:col-span-7 space-y-3">
          {/* OCR Mode */}
          {inputMode === 'ocr' && (
            <div className="bg-[#161b22] border-2 border-dashed border-[#30363d] hover:border-yellow-500 rounded-2xl p-6 text-center space-y-3 transition">
              <div className="w-12 h-12 bg-[#0d1117] rounded-2xl border border-[#30363d] flex items-center justify-center mx-auto text-yellow-400">
                <Camera className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  Scanner un Screenshot de Chat Dofus
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-0.5">
                  Faites simplement <kbd className="px-1.5 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-yellow-400 font-bold">Ctrl+V</kbd> pour coller une capture de votre chat d'achats Dofus.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessOCR(e.target.files[0])
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOCRProcessing}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choisir un fichier image</span>
                </button>
              </div>

              {isOCRProcessing && (
                <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] max-w-xs mx-auto text-xs text-slate-300 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                  <span>Analyse OCR de l'image en cours...</span>
                </div>
              )}

              {ocrError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2 max-w-md mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ocrError}</span>
                </div>
              )}
            </div>
          )}

          {/* Chat text paste mode */}
          {inputMode === 'chat' && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-yellow-400" />
                Coller le Texte du Chat Dofus
              </h3>
              <textarea
                value={chatTextInput}
                onChange={(e) => setChatTextInput(e.target.value)}
                rows={4}
                placeholder="Exemple :&#10;[14:22] Vous avez acheté 100 '[Gelée Bleuet]' pour 120 000 kamas.&#10;[14:23] Vous avez acheté 10 '[Rune Trans Do So]' pour 1 500 000 kamas."
                className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-slate-200 font-mono focus:border-yellow-500 outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProcessChatText}
                  disabled={!chatTextInput.trim()}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Analyser et Remplir le Tableau</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Bulk Table */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="p-3.5 px-4 border-b border-[#30363d] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Panier d'Achats ({rows.length} lignes)
                </span>
              </div>

              {rows.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Panier :</span>
                    <span className="font-mono text-sm font-bold text-yellow-400">
                      {formatKamas(totalBatchKamas)}
                    </span>
                  </div>

                  <button
                    onClick={handleCommitAll}
                    disabled={totalBatchKamas <= 0}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Ajouter tout au Stock</span>
                  </button>
                </div>
              )}
            </div>

            {/* Table Rows */}
            {rows.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-2">
                <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-200 text-sm">Votre panier d'achats est vide.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Cliquez sur les ressources à gauche, ou utilisez le scanner OCR / copier-coller de chat pour remplir rapidement vos achats.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#21262d] max-h-[580px] overflow-y-auto">
                {rows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#21262d]/40 transition"
                  >
                    {/* Item Name */}
                    <div className="flex items-center gap-2.5 min-w-[180px]">
                      <span className="text-[10px] font-mono text-slate-600">#{idx + 1}</span>
                      <img
                        src={row.item.image_urls?.icon}
                        alt={row.item.name}
                        className="w-8 h-8 object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/0-64.png'
                        }}
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{row.item.name}</p>
                        <span className="text-[10px] text-slate-500">{row.item.type?.name}</span>
                      </div>
                    </div>

                    {/* Quantity & Multipliers */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-semibold">Qté :</span>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => updateRow(row.id, { quantity: parseInt(e.target.value) || 1 })}
                        className="w-16 px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-center font-mono text-white focus:border-yellow-500 outline-none"
                      />
                      <div className="flex gap-0.5">
                        {[10, 50, 100].map(q => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => updateRow(row.id, { quantity: q })}
                            className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition ${
                              row.quantity === q
                                ? 'bg-yellow-400 text-slate-950 font-bold border-yellow-400'
                                : 'bg-[#0d1117] text-slate-400 border-[#30363d]'
                            }`}
                          >
                            x{q}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Input (Supports 1m, 500k) */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.priceInput}
                          onChange={(e) => updateRow(row.id, { priceInput: e.target.value })}
                          placeholder="Prix (ex: 1m, 500k)"
                          className="w-28 pl-2 pr-5 py-1 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs font-mono text-yellow-400 focus:border-yellow-500 outline-none"
                        />
                        <span className="absolute right-2 top-1 text-[10px] font-bold text-slate-500">
                          K
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateRow(row.id, { priceMode: row.priceMode === 'total' ? 'unit' : 'total' })}
                        className="px-2 py-1 bg-[#0d1117] border border-[#30363d] hover:border-slate-500 rounded text-[10px] font-bold text-slate-300"
                        title="Basculer entre prix total du lot et prix unitaire"
                      >
                        {row.priceMode === 'total' ? 'Lot' : 'Unitaire'}
                      </button>
                    </div>

                    {/* PRU calculation */}
                    <div className="text-right min-w-[90px]">
                      <span className="font-mono text-xs font-bold text-yellow-400 block">
                        {formatKamas(row.unitPrice)} / u
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Total: {formatKamas(row.totalPrice)}
                      </span>
                    </div>

                    {/* Delete row */}
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Actions */}
            {rows.length > 0 && (
              <div className="p-3 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRows([])}
                  className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Vider tout le panier</span>
                </button>

                <button
                  type="button"
                  onClick={handleCommitAll}
                  disabled={totalBatchKamas <= 0}
                  className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Valider et Ajouter {rows.length} lots ({formatKamas(totalBatchKamas)})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
