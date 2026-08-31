import React, { useState } from 'react'
import { Navbar } from './components/Navbar'
import { CraftWorkshop } from './components/CraftWorkshop'
import { FastHDVIndexer } from './components/FastHDVIndexer'
import { InventoryView } from './components/InventoryView'
import { HDVHistoryView } from './components/HDVHistoryView'
import { SalesTrackerView } from './components/SalesTrackerView'
import { RecipeBrowserView } from './components/RecipeBrowserView'
import { AnalyticsView } from './components/AnalyticsView'
import { HDVPurchaseModal } from './components/HDVPurchaseModal'
import { useCraftStore } from './store/useCraftStore'
import { DofusItem, StockItem } from './types'

export const App: React.FC = () => {
  const {
    batches,
    stockItems,
    craftHistory,
    salesHistory,
    referencePrices,
    activeTab,
    selectedItemForCraft,
    totalStockValue,
    totalSpentPurchases,
    totalNetProfit,
    totalCraftCount,
    setActiveTab,
    setSelectedItemForCraft,
    addPurchaseBatch,
    addMultipleBatches,
    deleteBatch,
    updateReferencePrice,
    executeCraft,
    recordSale,
    clearAllData,
    exportDataJson,
    importDataJson
  } = useCraftStore()

  const [globalSearch, setGlobalSearch] = useState('')
  const [isHDVModalOpen, setIsHDVModalOpen] = useState(false)
  const [preselectedHDVItem, setPreselectedHDVItem] = useState<DofusItem | null>(null)

  const handleOpenHDVModal = (item?: DofusItem) => {
    if (item) {
      setPreselectedHDVItem(item)
      setIsHDVModalOpen(true)
    } else {
      // Direct jump to fast indexer without opening annoying modals!
      setActiveTab('fast-hdv' as any)
    }
  }

  const handleSelectForCraft = (item: DofusItem) => {
    setSelectedItemForCraft(item)
    setActiveTab('workshop')
  }

  const handleOpenSaleModal = (_item: StockItem) => {
    setActiveTab('sales')
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col selection:bg-yellow-500/30 selection:text-yellow-200">
      {/* YouTube / Vinted Navbar */}
      <Navbar
        activeTab={activeTab as any}
        onSelectTab={setActiveTab as any}
        onOpenHDVModal={() => handleOpenHDVModal()}
        totalStockValue={totalStockValue}
        totalNetProfit={totalNetProfit}
        stockCount={stockItems.length}
        lotsCount={batches.length}
        globalSearch={globalSearch}
        onGlobalSearchChange={setGlobalSearch}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'workshop' && (
          <CraftWorkshop
            selectedItem={selectedItemForCraft}
            stockItems={stockItems}
            referencePrices={referencePrices}
            onSelectItem={setSelectedItemForCraft}
            onExecuteCraft={executeCraft}
            onOpenHDVWithItem={(item) => handleOpenHDVModal(item)}
            onUpdateRefPrice={updateReferencePrice}
          />
        )}

        {(activeTab as string) === 'fast-hdv' && (
          <FastHDVIndexer
            onAddMultipleBatches={addMultipleBatches}
            onAddSingleBatch={addPurchaseBatch}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            stockItems={stockItems}
            referencePrices={referencePrices}
            onSelectItemForCraft={handleSelectForCraft}
            onOpenHDVWithItem={(item) => handleOpenHDVModal(item)}
            onOpenSaleModal={handleOpenSaleModal}
            onDeleteBatch={deleteBatch}
            onUpdateRefPrice={updateReferencePrice}
            onOpenHDVModal={() => setActiveTab('fast-hdv' as any)}
          />
        )}

        {activeTab === 'hdv' && (
          <HDVHistoryView
            batches={batches}
            onOpenHDVModal={() => setActiveTab('fast-hdv' as any)}
            onOpenHDVWithItem={(item) => handleOpenHDVModal(item)}
            onDeleteBatch={deleteBatch}
          />
        )}

        {activeTab === 'sales' && (
          <SalesTrackerView
            salesHistory={salesHistory}
            stockItems={stockItems}
            onRecordSale={recordSale}
          />
        )}

        {activeTab === 'encyclopedia' && (
          <RecipeBrowserView
            stockItems={stockItems}
            referencePrices={referencePrices}
            searchQuery={globalSearch}
            onSelectForCraft={handleSelectForCraft}
            onOpenHDVWithItem={(item) => handleOpenHDVModal(item)}
            onUpdateRefPrice={updateReferencePrice}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            stockItems={stockItems}
            craftHistory={craftHistory}
            salesHistory={salesHistory}
            totalStockValue={totalStockValue}
            totalSpentPurchases={totalSpentPurchases}
            totalNetProfit={totalNetProfit}
            totalCraftCount={totalCraftCount}
            onExportJson={exportDataJson}
            onImportJson={importDataJson}
            onResetDemo={() => {}}
            onClearAll={clearAllData}
          />
        )}
      </main>

      {/* Quick single item purchase modal */}
      <HDVPurchaseModal
        isOpen={isHDVModalOpen}
        onClose={() => {
          setIsHDVModalOpen(false)
          setPreselectedHDVItem(null)
        }}
        onAddBatch={addPurchaseBatch}
        preselectedItem={preselectedHDVItem}
      />

      {/* Clean Marketplace Footer */}
      <footer className="mt-auto border-t border-[#21262d] bg-[#161b22] py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-400">
            DofusCraft Ledger • Indexeur HDV Rapide, OCR & Stock Dofus 3
          </p>
          <p className="text-[11px] text-slate-600">
            100% données réelles Dofus 3 • Scanner OCR & Saisie en vrac
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
