import React, { useState } from 'react'
import { Navbar } from './components/Navbar'
import { FastHDVIndexer } from './components/FastHDVIndexer'
import { MultiCraftPlannerView } from './components/MultiCraftPlannerView'
import { CraftWorkshop } from './components/CraftWorkshop'
import { InventoryView } from './components/InventoryView'
import { HDVHistoryView } from './components/HDVHistoryView'
import { SalesTrackerView } from './components/SalesTrackerView'
import { RecipeBrowserView } from './components/RecipeBrowserView'
import { AnalyticsView } from './components/AnalyticsView'
import { HDVPurchaseModal } from './components/HDVPurchaseModal'
import { ServerSelectModal } from './components/ServerSelectModal'
import { CrushItemModal } from './components/CrushItemModal'
import { useCraftStore } from './store/useCraftStore'
import { DofusItem, StockItem } from './types'

export const App: React.FC = () => {
  const {
    currentServer,
    hasChosenServer,
    switchServer,
    batches,
    stockItems,
    craftHistory,
    salesHistory,
    crushHistory,
    referencePrices,
    latestKnownPrices,
    latestCrushesByItem,
    craftPlan,
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
    recordCrush,
    addToCraftPlan,
    updateCraftPlanQuantity,
    removeFromCraftPlan,
    clearCraftPlan,
    clearAllData,
    exportDataJson,
    importDataJson
  } = useCraftStore()

  const [globalSearch, setGlobalSearch] = useState('')
  const [isHDVModalOpen, setIsHDVModalOpen] = useState(false)
  const [isServerModalOpen, setIsServerModalOpen] = useState(!hasChosenServer)
  const [preselectedHDVItem, setPreselectedHDVItem] = useState<DofusItem | null>(null)
  const [preselectedHDVQty, setPreselectedHDVQty] = useState<number>(100)
  const [isCrushModalOpen, setIsCrushModalOpen] = useState(false)
  const [itemToCrush, setItemToCrush] = useState<StockItem | null>(null)

  const handleOpenHDVModal = (item?: DofusItem, defaultQty?: number) => {
    if (item) {
      setPreselectedHDVItem(item)
      setPreselectedHDVQty(defaultQty && defaultQty > 0 ? defaultQty : 100)
      setIsHDVModalOpen(true)
    } else {
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

  const handleOpenCrushModal = (item: StockItem) => {
    setItemToCrush(item)
    setIsCrushModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col selection:bg-yellow-500/30 selection:text-yellow-200">
      {/* Navbar with Server Switcher & PWA */}
      <Navbar
        activeTab={activeTab as any}
        onSelectTab={setActiveTab as any}
        onOpenHDVModal={() => handleOpenHDVModal()}
        onOpenServerModal={() => setIsServerModalOpen(true)}
        currentServer={currentServer}
        totalStockValue={totalStockValue}
        totalNetProfit={totalNetProfit}
        stockCount={stockItems.length}
        lotsCount={batches.length}
        craftPlanCount={craftPlan.length}
        globalSearch={globalSearch}
        onGlobalSearchChange={setGlobalSearch}
      />

      {/* Main Content View Switcher */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {activeTab === 'fast-hdv' && (
          <FastHDVIndexer
            onAddMultipleBatches={addMultipleBatches}
            onAddSingleBatch={addPurchaseBatch}
          />
        )}

        {activeTab === 'multi-craft' && (
          <MultiCraftPlannerView
            craftPlan={craftPlan}
            stockItems={stockItems}
            referencePrices={referencePrices}
            onUpdateQuantity={updateCraftPlanQuantity}
            onRemovePlanItem={removeFromCraftPlan}
            onClearPlan={clearCraftPlan}
            onAddToPlan={addToCraftPlan}
            onExecuteAllCrafts={executeCraft}
            onOpenHDVWithItem={(item, qty) => handleOpenHDVModal(item, qty)}
          />
        )}

        {activeTab === 'workshop' && (
          <CraftWorkshop
            selectedItem={selectedItemForCraft}
            stockItems={stockItems}
            referencePrices={referencePrices}
            latestKnownPrices={latestKnownPrices}
            latestCrushesByItem={latestCrushesByItem}
            onSelectItem={setSelectedItemForCraft}
            onExecuteCraft={executeCraft}
            onOpenHDVWithItem={(item, qty) => handleOpenHDVModal(item, qty)}
            onUpdateRefPrice={updateReferencePrice}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            stockItems={stockItems}
            referencePrices={referencePrices}
            latestCrushesByItem={latestCrushesByItem}
            onSelectItemForCraft={handleSelectForCraft}
            onOpenHDVWithItem={(item) => handleOpenHDVModal(item)}
            onOpenSaleModal={handleOpenSaleModal}
            onOpenCrushModal={handleOpenCrushModal}
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
            latestKnownPrices={latestKnownPrices}
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

      {/* Server Choice Modal (Onboarding & Switcher) */}
      <ServerSelectModal
        isOpen={isServerModalOpen}
        currentServer={currentServer}
        onClose={() => setIsServerModalOpen(false)}
        onSelectServer={(s) => switchServer(s)}
        isFirstVisit={!hasChosenServer}
      />

      {/* Quick single item purchase modal */}
      <HDVPurchaseModal
        isOpen={isHDVModalOpen}
        onClose={() => {
          setIsHDVModalOpen(false)
          setPreselectedHDVItem(null)
          setPreselectedHDVQty(100)
        }}
        onAddBatch={addPurchaseBatch}
        preselectedItem={preselectedHDVItem}
        initialQuantity={preselectedHDVQty}
      />

      {/* Brisage / Crushing Modal */}
      <CrushItemModal
        isOpen={isCrushModalOpen}
        item={itemToCrush}
        referencePrices={referencePrices}
        onClose={() => {
          setIsCrushModalOpen(false)
          setItemToCrush(null)
        }}
        onRecordCrush={recordCrush}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-[#21262d] bg-[#161b22] py-3.5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-400">
            DofusCraft Ledger v3 • Indexeur HDV, Multi-Crafts, Brisage & Stock Dofus 3
          </p>
          <p className="text-[11px] text-slate-600">
            Serveur actif : <strong className="text-yellow-400 font-bold">{currentServer}</strong> • 100% PWA installable
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
