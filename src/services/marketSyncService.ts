import { MarketPriceEntry } from '../types'
import { supabaseService } from './supabaseService'

const BROADCAST_CHANNEL_NAME = 'kamacraft_market_prices_v1'

class MarketSyncService {
  private channel: BroadcastChannel | null = null
  private listeners: Set<(entry: MarketPriceEntry) => void> = new Set()
  private cloudUnsubscribe: (() => void) | null = null
  private activeServer: string = ''

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'PRICE_UPDATE' && event.data.entry) {
            this.notifyListeners(event.data.entry)
          }
        }
      } catch (err) {
        console.warn('BroadcastChannel not supported or failed:', err)
      }
    }
  }

  /**
   * Subscribe to live cross-tab & cloud price updates
   */
  public subscribe(callback: (entry: MarketPriceEntry) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(entry: MarketPriceEntry) {
    this.listeners.forEach(cb => {
      try {
        cb(entry)
      } catch (e) {
        console.error('Error in market sync listener:', e)
      }
    })
  }

  /**
   * Initialize cloud subscription & sync for a specific server
   */
  public initServerSync(serverId: string) {
    if (this.activeServer === serverId.toLowerCase() && this.cloudUnsubscribe) {
      return
    }

    this.activeServer = serverId.toLowerCase()

    if (this.cloudUnsubscribe) {
      this.cloudUnsubscribe()
      this.cloudUnsubscribe = null
    }

    // Subscribe to cloud Realtime changes
    if (supabaseService.isConfigured()) {
      this.cloudUnsubscribe = supabaseService.subscribeToServer(serverId, (entry) => {
        const current = this.loadPricesForServer(serverId)
        const existing = current[entry.item_ankama_id]

        // Only update if newer or not present
        if (!existing || new Date(entry.updated_at).getTime() >= new Date(existing.updated_at).getTime()) {
          current[entry.item_ankama_id] = entry
          this.savePricesForServer(serverId, current)
          this.notifyListeners(entry)
        }
      })

      // Fetch all server prices from cloud in background
      this.syncFromCloud(serverId)
    }
  }

  /**
   * Fetch complete server price book from cloud and merge with local storage
   */
  public async syncFromCloud(serverId: string): Promise<number> {
    if (!supabaseService.isConfigured()) return 0

    try {
      const cloudPrices = await supabaseService.fetchServerPrices(serverId)
      if (cloudPrices.length === 0) return 0

      const current = this.loadPricesForServer(serverId)
      let updatedCount = 0

      for (const cloudEntry of cloudPrices) {
        const existing = current[cloudEntry.item_ankama_id]
        if (!existing || new Date(cloudEntry.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
          current[cloudEntry.item_ankama_id] = cloudEntry
          updatedCount++
          this.notifyListeners(cloudEntry)
        }
      }

      if (updatedCount > 0) {
        this.savePricesForServer(serverId, current)
      }

      return updatedCount
    } catch (err) {
      console.warn('syncFromCloud error:', err)
      return 0
    }
  }

  /**
   * Load market prices for a specific server from localStorage
   */
  public loadPricesForServer(serverId: string): Record<number, MarketPriceEntry> {
    const key = `dofuscraft_market_prices_${serverId.toLowerCase()}_v1`
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed: Record<number, MarketPriceEntry> = JSON.parse(saved)
        const clean: Record<number, MarketPriceEntry> = {}
        for (const [idStr, entry] of Object.entries(parsed)) {
          if (entry && entry.source !== 'seed' && entry.price > 0) {
            clean[parseInt(idStr)] = entry
          }
        }
        return clean
      }
    } catch (e) {
      console.warn('Failed to parse saved market prices:', e)
    }

    return {}
  }

  /**
   * Save entire server market prices map
   */
  public savePricesForServer(serverId: string, prices: Record<number, MarketPriceEntry>): void {
    const key = `dofuscraft_market_prices_${serverId.toLowerCase()}_v1`
    try {
      localStorage.setItem(key, JSON.stringify(prices))
    } catch (e) {
      console.warn('Failed to save market prices to localStorage:', e)
    }
  }

  /**
   * Publish a single price update to local, cross-tab, and Cloud Supabase
   */
  public publishPrice(
    serverId: string,
    itemAnkamaId: number,
    price: number,
    itemName?: string,
    source: 'community' | 'local' | 'ocr' | 'seed' = 'community',
    author: string = 'Artisan'
  ): MarketPriceEntry {
    const entry: MarketPriceEntry = {
      item_ankama_id: itemAnkamaId,
      item_name: itemName,
      price: Math.max(0, price),
      updated_at: new Date().toISOString(),
      server_id: serverId,
      source,
      author
    }

    // 1. Update in localStorage
    const current = this.loadPricesForServer(serverId)
    current[itemAnkamaId] = entry
    this.savePricesForServer(serverId, current)

    // 2. Broadcast to other browser tabs
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'PRICE_UPDATE', entry })
      } catch (err) {
        console.warn('BroadcastChannel postMessage error:', err)
      }
    }

    // 3. Push to Cloud Supabase
    if (supabaseService.isConfigured()) {
      supabaseService.upsertPrice(entry).catch(err => console.warn('Cloud sync error:', err))
    }

    this.notifyListeners(entry)
    return entry
  }

  /**
   * Batch publish prices (e.g. after OCR scan or bulk indexing)
   */
  public publishMultiplePrices(
    serverId: string,
    items: Array<{ itemAnkamaId: number; price: number; itemName?: string }>,
    source: 'community' | 'local' | 'ocr' | 'seed' = 'community',
    author: string = 'Artisan'
  ): Record<number, MarketPriceEntry> {
    const current = this.loadPricesForServer(serverId)
    const now = new Date().toISOString()
    const entriesToSync: MarketPriceEntry[] = []

    for (const it of items) {
      if (it.itemAnkamaId && it.price > 0) {
        const entry: MarketPriceEntry = {
          item_ankama_id: it.itemAnkamaId,
          item_name: it.itemName,
          price: Math.max(0, it.price),
          updated_at: now,
          server_id: serverId,
          source,
          author
        }
        current[it.itemAnkamaId] = entry
        entriesToSync.push(entry)

        if (this.channel) {
          try {
            this.channel.postMessage({ type: 'PRICE_UPDATE', entry })
          } catch {}
        }
        this.notifyListeners(entry)
      }
    }

    this.savePricesForServer(serverId, current)

    // Push batch to Cloud Supabase
    if (supabaseService.isConfigured() && entriesToSync.length > 0) {
      supabaseService.upsertMultiplePrices(entriesToSync).catch(err => console.warn('Cloud batch error:', err))
    }

    return current
  }
}

export const marketSyncService = new MarketSyncService()

/**
 * Format relative time (Dofocus style: "Il y a 6 min", "Il y a 2h", "03/09 à 11:20")
 */
export function formatMarketRelativeTime(isoDate?: string): string {
  if (!isoDate) return 'Non indexé'

  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 45) {
    return "À l'instant"
  }
  if (diffMin < 60) {
    return `Il y a ${diffMin} min`
  }
  if (diffHour < 24) {
    return `Il y a ${diffHour}h`
  }
  if (diffDay < 7) {
    return `Il y a ${diffDay}j`
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month} à ${hours}:${minutes}`
}
