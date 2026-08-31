export interface DofusItem {
  ankama_id: number
  name: string
  type: {
    id: number
    name: string
  }
  level: number
  image_urls?: {
    icon?: string
    sd?: string
    hd?: string
  }
  recipe?: DofusRecipeIngredient[]
  description?: string
  effects?: Array<{
    int_minimum: number
    int_maximum: number
    type: {
      name: string
      id: number
    }
  }>
  is_weapon?: boolean
  pods?: number
  category?: 'equipment' | 'resources' | 'consumables' | 'runes' | any
}

export interface DofusRecipeIngredient {
  item_ankama_id: number
  item_subtype?: string
  quantity: number
  item_name?: string
  item_icon?: string
}

export interface PurchaseBatch {
  id: string
  item_ankama_id: number
  item_name: string
  item_type: string
  item_icon: string
  item_level: number
  category: string
  quantity: number
  remaining_quantity: number
  total_price: number
  unit_price: number
  date: string
  note?: string
  server_id?: string
}

export interface StockItem {
  item_ankama_id: number
  name: string
  type: string
  icon: string
  level: number
  category: string
  total_quantity: number
  total_value: number
  pru: number
  reference_price?: number
  batches: PurchaseBatch[]
}

export interface CraftRequirement {
  item_ankama_id: number
  name: string
  icon: string
  type: string
  category: string
  required_qty: number
  available_qty: number
  missing_qty: number
  is_satisfied: boolean
  stock_pru: number
  estimated_unit_price: number
  stock_cost_used: number
  missing_cost_estimated: number
  total_cost_projected: number
}

export interface CraftRecord {
  id: string
  item_ankama_id: number
  item_name: string
  item_icon: string
  item_level?: number
  quantity: number
  total_craft_cost: number
  unit_craft_cost: number
  unit_pru?: number
  date: string
  consumed_resources?: Array<{
    item_ankama_id?: number
    batch_id?: string
    item_name: string
    item_icon?: string
    quantity?: number
    quantity_used?: number
    unit_cost?: number
    unit_price?: number
    total_cost?: number
  }>
  server_id?: string
}

export interface SaleRecord {
  id: string
  item_ankama_id: number
  item_name: string
  item_icon: string
  quantity: number
  unit_sale_price: number
  total_sale_price: number
  unit_craft_cost: number
  unit_pru?: number
  total_cost: number
  tax_rate?: number
  total_tax: number
  tax_amount?: number
  total_net: number
  net_revenue?: number
  net_profit: number
  roi_percent: number
  roi_percentage?: number
  date: string
  server_id?: string
}

export interface DofusServer {
  id: string
  name: string
  type: 'mono' | 'multi' | 'epic' | 'unity'
  description: string
  icon: string
  badgeColor: string
}

export interface CraftPlanItem {
  id: string
  item: DofusItem
  quantity: number
  dateAdded: string
}

export interface AggregatedCraftIngredient {
  item_ankama_id: number
  item_name: string
  item_icon: string
  total_required: number
  in_stock: number
  missing_deficit: number
  unit_pru: number
  estimated_cost: number
  contributing_crafts: Array<{ craft_name: string; qty: number }>
}
