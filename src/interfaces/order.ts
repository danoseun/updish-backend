export interface Order {
    id?: number;
    user_id?: number;
    start_date?: Date;
    end_date?: Date;
    payment_plan_id?: string;
    number_of_meals?: string;
    total_price?: number;
    code?: string;
    status?: string;
    transaction_ref?: string;
    created_at?: Date;
    updated_at?: Date;
}