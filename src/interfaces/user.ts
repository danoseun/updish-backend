export interface User {
    id?: number;
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    age?: string;
    state?: string;
    city?: string;
    address?: string;
    is_email_verified?: boolean;
    is_phone_number_verified?: boolean;
    identity_verified?: boolean;
    bio?: string;
    image_url?: string;
    accessToken?: string;
    is_active?: boolean;
    deactivated_at?: Date;
    deletion_scheduled_at?: Date;
    created_at?: Date;
    updated_at?: Date;
  }
  
  export interface User_Image {
    id?: number;
    user_id: number;
    public_id: string;
    image_url: string;
  }

  export interface Address {
    id?: number;
    user_id: number;
    state: string;
    city: string;
    address: string;
    created_at?: Date;
    updated_at?: Date;
  }
  