export interface Order {
    id?: number;
    user_id?: number;
    start_date?: Date;
    end_date?: Date;
    status?: string;
    total_price?: number;
    code?: string;
    transaction_ref?: string;
    created_at?: Date;
    updated_at?: Date;
}