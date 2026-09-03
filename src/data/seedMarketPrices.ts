import { MarketPriceEntry } from '../types'

// Helper to compute recent past timestamp
function getPastIso(minutesAgo: number): string {
  const d = new Date(Date.now() - minutesAgo * 60 * 1000)
  return d.toISOString()
}

/**
 * Baseline community market prices per item for Dofus 3 servers (Draconiros, Orukam, Imagiro, etc.)
 */
export const SEED_MARKET_PRICES: Record<number, { name: string; price: number; minutesAgo: number }> = {
  // --- Équipements populaires ---
  2469: { name: "Gelano", price: 120000, minutesAgo: 14 },
  8460: { name: "Voile d'Encre", price: 28500000, minutesAgo: 45 },
  11187: { name: "Alliance Gloursonne", price: 4200000, minutesAgo: 72 },
  15286: { name: "Pikano", price: 650000, minutesAgo: 30 },
  16580: { name: "Bague Volkorne", price: 5400000, minutesAgo: 110 },
  16738: { name: "Pendentif Volkorne", price: 7200000, minutesAgo: 85 },
  11186: { name: "Amulette du Glourséleste", price: 3800000, minutesAgo: 190 },

  // --- Galets & Pépites ---
  13320: { name: "Galet Brasillant", price: 185000, minutesAgo: 8 },
  12739: { name: "Galet Rutilant", price: 34000, minutesAgo: 22 },
  12738: { name: "Galet Solaire", price: 42000, minutesAgo: 38 },
  12737: { name: "Galet Cramoisi", price: 28000, minutesAgo: 50 },
  14500: { name: "Pépite", price: 24, minutesAgo: 5 },
  17500: { name: "Tourmaline", price: 48000, minutesAgo: 17 },

  // --- Runes FM ---
  110001: { name: "Rune Ga Pâ", price: 88000, minutesAgo: 6 },
  110002: { name: "Rune Ga Pme", price: 115000, minutesAgo: 11 },
  110003: { name: "Rune Po", price: 9500, minutesAgo: 25 },
  110004: { name: "Rune Invo", price: 14000, minutesAgo: 40 },
  110007: { name: "Rune Ra Fo", price: 2800, minutesAgo: 15 },
  110010: { name: "Rune Ra Vi", price: 3600, minutesAgo: 9 },
  110013: { name: "Rune Ra Ine", price: 2900, minutesAgo: 28 },
  110016: { name: "Rune Ra Cha", price: 2700, minutesAgo: 33 },
  110019: { name: "Rune Ra Age", price: 3100, minutesAgo: 19 },
  110022: { name: "Rune Ra Sa", price: 4500, minutesAgo: 42 },
  110025: { name: "Rune Do Terre", price: 3200, minutesAgo: 16 },
  110026: { name: "Rune Do Feu", price: 3100, minutesAgo: 21 },
  110027: { name: "Rune Do Eau", price: 3400, minutesAgo: 35 },
  110028: { name: "Rune Do Air", price: 3300, minutesAgo: 29 },
  110034: { name: "Rune Ré Neutre", price: 1900, minutesAgo: 55 },
  110035: { name: "Rune Ré Terre", price: 2100, minutesAgo: 60 },
  110036: { name: "Rune Ré Feu", price: 2200, minutesAgo: 48 },
  110037: { name: "Rune Ré Eau", price: 2400, minutesAgo: 65 },
  110038: { name: "Rune Ré Air", price: 2300, minutesAgo: 70 },

  // --- Ressources de Craft communes ---
  757: { name: "Gelée Bleuet", price: 420, minutesAgo: 12 },
  368: { name: "Gelée à la Fraise", price: 380, minutesAgo: 14 },
  369: { name: "Gelée à la Menthe", price: 490, minutesAgo: 18 },
  2436: { name: "Gelée Citron", price: 1250, minutesAgo: 20 },
  2437: { name: "Gelée Citron Royale", price: 18500, minutesAgo: 32 },
  2242: { name: "Gelée Fraise Royale", price: 14200, minutesAgo: 44 },
  370: { name: "Gelée Bleuet Royale", price: 16000, minutesAgo: 50 },
  2241: { name: "Gelée Menthe Royale", price: 15500, minutesAgo: 38 },
  8443: { name: "Encre du Kralamoure", price: 1450000, minutesAgo: 60 },
  8444: { name: "Ventouse du Kralamoure", price: 180000, minutesAgo: 75 },
  8445: { name: "Oeil de Circueur", price: 42000, minutesAgo: 90 },
  8446: { name: "Étoffe de Roissingue", price: 85000, minutesAgo: 110 },
  11136: { name: "Poil de Barbe du Glourséleste", price: 120000, minutesAgo: 40 },
  11137: { name: "Queue de Glourséleste", price: 95000, minutesAgo: 45 },
  15300: { name: "Substrat de Futaie", price: 14500, minutesAgo: 26 },
  15301: { name: "Substrat de Bocage", price: 18200, minutesAgo: 54 },

  // --- Minerais & Métaux ---
  441: { name: "Fer", price: 45, minutesAgo: 4 },
  442: { name: "Cuivre", price: 78, minutesAgo: 7 },
  443: { name: "Bronze", price: 120, minutesAgo: 15 },
  444: { name: "Argent", price: 210, minutesAgo: 22 },
  445: { name: "Or", price: 490, minutesAgo: 18 },
  446: { name: "Bauxite", price: 340, minutesAgo: 31 },
  447: { name: "Ébène", price: 620, minutesAgo: 24 },
  448: { name: "Dolomite", price: 750, minutesAgo: 36 },
  449: { name: "Silicate", price: 820, minutesAgo: 42 },
  450: { name: "Obsidienne", price: 1450, minutesAgo: 19 },

  // --- Bois & Substrats ---
  701: { name: "Bois de Frêne", price: 35, minutesAgo: 5 },
  702: { name: "Bois de Châtaignier", price: 62, minutesAgo: 9 },
  703: { name: "Bois de Noyer", price: 95, minutesAgo: 14 },
  704: { name: "Bois de Chêne", price: 140, minutesAgo: 21 },
  705: { name: "Bois d'Érable", price: 280, minutesAgo: 30 },
  706: { name: "Bois d'If", price: 420, minutesAgo: 28 },
  707: { name: "Bois de Merisier", price: 650, minutesAgo: 45 },
  708: { name: "Bois d'Ébène", price: 890, minutesAgo: 37 },
  709: { name: "Bois de Charme", price: 1250, minutesAgo: 50 },
  710: { name: "Bois d'Orme", price: 3400, minutesAgo: 65 },
  711: { name: "Bois de Tremble", price: 1800, minutesAgo: 40 }
}

/**
 * Generate initial market prices for a given server
 */
export function getInitialMarketPricesForServer(serverId: string): Record<number, MarketPriceEntry> {
  const result: Record<number, MarketPriceEntry> = {}

  // Slight server coefficient for natural variation
  const serverMultipliers: Record<string, number> = {
    draconiros: 1.0,
    orukam: 0.95,
    imagiro: 0.98,
    ombre: 1.45,
    talok: 1.15
  }

  const mult = serverMultipliers[serverId.toLowerCase()] || 1.0

  for (const [idStr, entry] of Object.entries(SEED_MARKET_PRICES)) {
    const ankamaId = parseInt(idStr)
    const adjustedPrice = Math.round((entry.price * mult) / 10) * 10

    result[ankamaId] = {
      item_ankama_id: ankamaId,
      item_name: entry.name,
      price: adjustedPrice,
      updated_at: getPastIso(entry.minutesAgo),
      server_id: serverId,
      source: 'seed',
      author: 'Communauté HDV'
    }
  }

  return result
}
