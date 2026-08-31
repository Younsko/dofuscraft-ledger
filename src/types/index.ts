export interface DofusRecipeIngredient {
  item_ankama_id: number
  item_subtype?: string
  quantity: number
  item_name?: string
  item_icon?: string
}

export interface DofusItem {
  ankama_id: number
  name: string
  type: {
    id: number
    name: string
  }
  level: number
  image_urls: {
    icon: string
    sd?: string
    hd?: string
  }
  recipe?: DofusRecipeIngredient[]
  description?: string
  effects?: Array<{
    formatted?: string
    int_minimum?: number
    int_maximum?: number
    type?: {
      id?: number
      name?: string
    }
  }>
  is_weapon?: boolean
  pods?: number
  category?: 'equipment' | 'resources' | 'consumables' | 'runes'
}

export interface PurchaseBatch {
  id: string
  item_ankama_id: number
  item_name: string
  item_type: string
  item_icon: string
  item_level: number
  category: 'equipment' | 'resources' | 'consumables' | 'runes'
  quantity: number // quantité totale achetée
  remaining_quantity: number // quantité restante en stock
  total_price: number // prix total payé en Kamas
  unit_price: number // prix unitaire
  date: string // ISO string
  note?: string
}

export interface StockItem {
  item_ankama_id: number
  name: string
  type: string
  icon: string
  level: number
  category: 'equipment' | 'resources' | 'consumables' | 'runes'
  total_quantity: number
  total_value: number
  pru: number // Prix de Revient Unitaire moyen pondéré
  reference_price?: number // Prix de vente / HDV estimé
  batches: PurchaseBatch[]
  is_crafted?: boolean
}

export interface CraftRequirement {
  item_ankama_id: number
  name: string
  icon: string
  type: string
  category: 'equipment' | 'resources' | 'consumables' | 'runes'
  required_qty: number
  available_qty: number
  missing_qty: number
  is_satisfied: boolean
  stock_pru: number // PRU unitaire moyen en stock
  estimated_unit_price: number // Prix unitaire estimé pour les manquants
  stock_cost_used: number // Coût des items puisés en stock
  missing_cost_estimated: number // Coût estimé à acheter
  total_cost_projected: number
}

export interface CraftRecord {
  id: string
  item_ankama_id: number
  item_name: string
  item_icon: string
  item_level: number
  quantity: number
  total_craft_cost: number
  unit_craft_cost: number // PRU du craft
  hdv_estimated_unit_price?: number
  consumed_resources: Array<{
    item_ankama_id: number
    item_name: string
    item_icon: string
    quantity: number
    unit_cost: number
    total_cost: number
  }>
  date: string
}

export interface SaleRecord {
  id: string
  item_ankama_id: number
  item_name: string
  item_icon: string
  quantity: number
  unit_craft_cost: number // PRU
  unit_sale_price: number // Prix unitaire HDV
  tax_percent: number // Ex: 2%
  total_gross: number
  total_tax: number
  total_net: number
  total_cost: number
  net_profit: number
  roi_percent: number
  date: string
}

export interface ReferencePriceMap {
  [ankama_id: number]: number
}
