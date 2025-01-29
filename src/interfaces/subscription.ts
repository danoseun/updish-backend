export interface Subscription {
    id?: number;
    user_id?: number;
    order_id?: number;
    start_date?: Date;
    end_date?: Date;
    payment_plan_id?: string;
    transaction_ref?: string;
    status?: string;
    total_price?: number;
    created_at?: Date;
    updated_at?: Date;
}