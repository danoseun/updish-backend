export interface Item {
    id?: number;
    admin_id?: number;
    name?: string;
    uom?: number;
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
    item: string;
    qty: number;
  }
  
  export interface Bundle {
    id?: number;
    name: string;
    items: BundleItem[];
    health_impact: string;
    price: string;
    is_active: boolean;
  }