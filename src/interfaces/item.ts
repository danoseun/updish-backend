export interface Item {
    id?: number;
    admin_id?: number;
    item_name?: string;
    uom?: string;
    allergies?: string;
    class_of_food?: string;
    calories_per_uom?: string;
    parent_item?: string;
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
  }