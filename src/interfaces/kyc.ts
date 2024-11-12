export interface KYC {
  id?: number;
  user_id?: string;
  sex: string;
  health_goals: string;
  dietary_preferences: string;
  food_allergies: string[];
  health_concerns: string[];
  created_at?: Date;
  updated_at?: Date;
}
