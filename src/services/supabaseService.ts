import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { MarketPriceEntry } from '../types'

const STORAGE_URL_KEY = 'kamacraft_supabase_url_v1'
const STORAGE_ANON_KEY = 'kamacraft_supabase_anon_key_v1'

class SupabaseService {
  private client: SupabaseClient | null = null
  private currentServer: string = ''
  private realtimeChannel: any = null

  constructor() {
    this.initClient()
  }

  public initClient(): boolean {
    const url = this.getSupabaseUrl()
    const key = this.getSupabaseKey()

    if (url && key) {
      try {
        this.client = createClient(url, key, {
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        })
        return true
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err)
        this.client = null
        return false
      }
    }

    this.client = null
    return false
  }

  public isConfigured(): boolean {
    return this.client !== null
  }

  public getSupabaseUrl(): string {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) : '') ||
      (import.meta.env.VITE_SUPABASE_URL as string) ||
      ''
    )
  }

  public getSupabaseKey(): string {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) : '') ||
      (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
      ''
    )
  }

  public saveConfig(url: string, key: string): boolean {
    const cleanUrl = url.trim()
    const cleanKey = key.trim()

    if (cleanUrl && cleanKey) {
      localStorage.setItem(STORAGE_URL_KEY, cleanUrl)
      localStorage.setItem(STORAGE_ANON_KEY, cleanKey)
    } else {
      localStorage.removeItem(STORAGE_URL_KEY)
      localStorage.removeItem(STORAGE_ANON_KEY)
    }

    return this.initClient()
  }

  /**
   * Fetch all recorded market prices for a specific Dofus server
   */
  public async fetchServerPrices(serverId: string): Promise<MarketPriceEntry[]> {
    if (!this.client) return []

    try {
      const { data, error } = await this.client
        .from('market_prices')
        .select('*')
        .eq('server_id', serverId.toLowerCase())

      if (error) {
        console.warn('Supabase fetchServerPrices error:', error.message)
        return []
      }

      return (data || []).map((row: any) => ({
        item_ankama_id: Number(row.item_ankama_id),
        item_name: row.item_name,
        price: Number(row.price),
        updated_at: row.updated_at,
        server_id: row.server_id,
        source: row.source || 'community',
        author: row.author || 'Artisan'
      }))
    } catch (err) {
      console.warn('fetchServerPrices error:', err)
      return []
    }
  }

  /**
   * Upsert a single price to the cloud
   */
  public async upsertPrice(entry: MarketPriceEntry): Promise<boolean> {
    if (!this.client) return false

    try {
      const { error } = await this.client
        .from('market_prices')
        .upsert(
          {
            server_id: entry.server_id.toLowerCase(),
            item_ankama_id: entry.item_ankama_id,
            price: entry.price,
            item_name: entry.item_name || '',
            updated_at: entry.updated_at,
            source: entry.source || 'community',
            author: entry.author || 'Artisan'
          },
          { onConflict: 'server_id,item_ankama_id' }
        )

      if (error) {
        console.warn('Supabase upsertPrice error:', error.message)
        return false
      }
      return true
    } catch (err) {
      console.warn('upsertPrice exception:', err)
      return false
    }
  }

  /**
   * Upsert multiple prices in bulk (e.g. after OCR scan or bulk indexing)
   */
  public async upsertMultiplePrices(entries: MarketPriceEntry[]): Promise<boolean> {
    if (!this.client || entries.length === 0) return false

    try {
      const rows = entries.map(e => ({
        server_id: e.server_id.toLowerCase(),
        item_ankama_id: e.item_ankama_id,
        price: e.price,
        item_name: e.item_name || '',
        updated_at: e.updated_at,
        source: e.source || 'community',
        author: e.author || 'Artisan'
      }))

      const { error } = await this.client
        .from('market_prices')
        .upsert(rows, { onConflict: 'server_id,item_ankama_id' })

      if (error) {
        console.warn('Supabase upsertMultiplePrices error:', error.message)
        return false
      }
      return true
    } catch (err) {
      console.warn('upsertMultiplePrices exception:', err)
      return false
    }
  }

  /**
   * Subscribe to real-time price updates for a server
   */
  public subscribeToServer(
    serverId: string,
    onUpdate: (entry: MarketPriceEntry) => void
  ): () => void {
    if (!this.client) return () => {}

    if (this.realtimeChannel) {
      try {
        this.realtimeChannel.unsubscribe()
      } catch {}
    }

    this.currentServer = serverId.toLowerCase()
    const channelName = `kamacraft_${this.currentServer}_prices`

    this.realtimeChannel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_prices',
          filter: `server_id=eq.${this.currentServer}`
        },
        (payload: any) => {
          const row = payload.new
          if (row && row.item_ankama_id && row.price > 0) {
            const entry: MarketPriceEntry = {
              item_ankama_id: Number(row.item_ankama_id),
              item_name: row.item_name,
              price: Number(row.price),
              updated_at: row.updated_at,
              server_id: row.server_id,
              source: row.source || 'community',
              author: row.author || 'Artisan'
            }
            onUpdate(entry)
          }
        }
      )
      .subscribe()

    return () => {
      if (this.realtimeChannel) {
        try {
          this.realtimeChannel.unsubscribe()
        } catch {}
      }
    }
  }
}

export const supabaseService = new SupabaseService()
