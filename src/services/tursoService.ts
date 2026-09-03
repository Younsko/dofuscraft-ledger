import { createClient, Client } from '@libsql/client/web'
import { MarketPriceEntry } from '../types'

const STORAGE_URL_KEY = 'kamacraft_turso_url_v1'
const STORAGE_TOKEN_KEY = 'kamacraft_turso_token_v1'

class TursoService {
  private client: Client | null = null
  private isTableInitialized: boolean = false

  constructor() {
    this.initClient()
  }

  public initClient(): boolean {
    const rawUrl = this.getTursoUrl()
    const token = this.getTursoToken()

    if (rawUrl && token) {
      try {
        // Ensure https or libsql scheme
        let cleanUrl = rawUrl.trim()
        if (cleanUrl.startsWith('libsql://')) {
          cleanUrl = cleanUrl.replace('libsql://', 'https://')
        }
        if (!cleanUrl.startsWith('https://') && !cleanUrl.startsWith('http://')) {
          cleanUrl = `https://${cleanUrl}`
        }

        this.client = createClient({
          url: cleanUrl,
          authToken: token.trim()
        })

        // Auto-initialize schema in background
        this.ensureTable()
        return true
      } catch (err) {
        console.warn('Failed to initialize Turso client:', err)
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

  public getTursoUrl(): string {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) : '') ||
      (import.meta.env.VITE_TURSO_DATABASE_URL as string) ||
      'libsql://kamacraft-db-younsko.aws-eu-west-1.turso.io'
    )
  }

  public getTursoToken(): string {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_TOKEN_KEY) : '') ||
      (import.meta.env.VITE_TURSO_AUTH_TOKEN as string) ||
      'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0MjYzOTMsImlkIjoiMDFhMDY2ODQtZGYwMS03MTY2LTg1YzUtYzg5NjNkZmNmMzQzIiwia2lkIjoiQTBRTHlCRVhNYkhPVG1tREpadzJtcUxKcDdiT0lKa3ExTkdiUnN6X1B3RSIsInJpZCI6IjE0MzI4NGIyLTg3NzAtNGJmNC1iOGU5LTVjOGUyMGZhZWJmZiJ9.FFhn4AovEK7B5u4qI3XwMAKVWcSuiMukGOk_pSWoKTLUfncj3kRtbSTMXG3rj5pgsLBJrJ0c00loX0-AeRv0DA'
    )
  }

  public saveConfig(url: string, token: string): boolean {
    const cleanUrl = url.trim()
    const cleanToken = token.trim()

    if (cleanUrl && cleanToken) {
      localStorage.setItem(STORAGE_URL_KEY, cleanUrl)
      localStorage.setItem(STORAGE_TOKEN_KEY, cleanToken)
    } else {
      localStorage.removeItem(STORAGE_URL_KEY)
      localStorage.removeItem(STORAGE_TOKEN_KEY)
    }

    this.isTableInitialized = false
    return this.initClient()
  }

  /**
   * Automatically ensure market_prices table exists in Turso
   */
  public async ensureTable(): Promise<boolean> {
    if (!this.client || this.isTableInitialized) return true

    try {
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS market_prices (
          server_id TEXT NOT NULL,
          item_ankama_id INTEGER NOT NULL,
          price INTEGER NOT NULL,
          item_name TEXT,
          updated_at TEXT NOT NULL,
          source TEXT DEFAULT 'community',
          author TEXT DEFAULT 'Artisan',
          PRIMARY KEY (server_id, item_ankama_id)
        );
      `)
      this.isTableInitialized = true
      return true
    } catch (err) {
      console.warn('Turso ensureTable error:', err)
      return false
    }
  }

  /**
   * Fetch all market prices for a specific server
   */
  public async fetchServerPrices(serverId: string): Promise<MarketPriceEntry[]> {
    if (!this.client) return []
    await this.ensureTable()

    try {
      const res = await this.client.execute({
        sql: `
          SELECT server_id, item_ankama_id, price, item_name, updated_at, source, author
          FROM market_prices
          WHERE server_id = ?
        `,
        args: [serverId.toLowerCase()]
      })

      return res.rows.map((row: any) => ({
        server_id: String(row.server_id),
        item_ankama_id: Number(row.item_ankama_id),
        price: Number(row.price),
        item_name: row.item_name ? String(row.item_name) : undefined,
        updated_at: String(row.updated_at),
        source: (row.source as any) || 'community',
        author: row.author ? String(row.author) : 'Artisan'
      }))
    } catch (err) {
      console.warn('Turso fetchServerPrices error:', err)
      return []
    }
  }

  /**
   * Upsert a single price into Turso
   */
  public async upsertPrice(entry: MarketPriceEntry): Promise<boolean> {
    if (!this.client) return false
    await this.ensureTable()

    try {
      await this.client.execute({
        sql: `
          INSERT INTO market_prices (server_id, item_ankama_id, price, item_name, updated_at, source, author)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(server_id, item_ankama_id) DO UPDATE SET
            price = excluded.price,
            item_name = excluded.item_name,
            updated_at = excluded.updated_at,
            source = excluded.source,
            author = excluded.author;
        `,
        args: [
          entry.server_id.toLowerCase(),
          entry.item_ankama_id,
          entry.price,
          entry.item_name || '',
          entry.updated_at,
          entry.source || 'community',
          entry.author || 'Artisan'
        ]
      })
      return true
    } catch (err) {
      console.warn('Turso upsertPrice error:', err)
      return false
    }
  }

  /**
   * Upsert multiple prices in a single atomic batch
   */
  public async upsertMultiplePrices(entries: MarketPriceEntry[]): Promise<boolean> {
    if (!this.client || entries.length === 0) return false
    await this.ensureTable()

    try {
      const statements = entries.map(e => ({
        sql: `
          INSERT INTO market_prices (server_id, item_ankama_id, price, item_name, updated_at, source, author)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(server_id, item_ankama_id) DO UPDATE SET
            price = excluded.price,
            item_name = excluded.item_name,
            updated_at = excluded.updated_at,
            source = excluded.source,
            author = excluded.author;
        `,
        args: [
          e.server_id.toLowerCase(),
          e.item_ankama_id,
          e.price,
          e.item_name || '',
          e.updated_at,
          e.source || 'community',
          e.author || 'Artisan'
        ]
      }))

      await this.client.batch(statements, 'write')
      return true
    } catch (err) {
      console.warn('Turso batch error:', err)
      return false
    }
  }
}

export const tursoService = new TursoService()
