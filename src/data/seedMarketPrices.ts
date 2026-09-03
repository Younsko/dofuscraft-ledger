import { MarketPriceEntry } from '../types'

/**
 * No fake/mock data. Market prices must strictly originate from actual user scans,
 * OCR imports, or manual HDV entries.
 */
export const SEED_MARKET_PRICES: Record<number, { name: string; price: number; minutesAgo: number }> = {}

/**
 * Clean initial market prices for a server (empty until indexed by users)
 */
export function getInitialMarketPricesForServer(_serverId: string): Record<number, MarketPriceEntry> {
  return {}
}
