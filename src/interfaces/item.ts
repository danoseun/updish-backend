export interface Item {
  id?: number;
  admin_id?: number;
  name?: string;
  uom?: number;
  description?: string;
  allergies?: string;
  class_of_food?: string;
  calories_per_uom?: string;
  parent_item?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ParentItem {
  id?: number;
  admin_id?: number;
  name?: string;
}

export interface BundleItem {
  id?: number;
  item: number;
  qty: number;
}

export enum CATEGORY {
  BREAKFAST = "breakfast",
  LUNCH = "lunch",
  DINNER = "dinner",
}

export interface Bundle {
  id?: number;
  name: string;
  items: BundleItem[];
  health_impact: string;
  category: string;
  price: string;
  is_active: boolean;
  is_extra?: boolean;
}
