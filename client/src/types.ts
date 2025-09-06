export type Plan = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
  admin_id?: number | null;
  created_at?: string;
};


export type FormState = {
  name: string;
  description: string;
  price: string;
  duration: string;
  imageFile: File | null;
  removeImage: boolean;
};


export type SubscriptionView = {
  subscription_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  renewal_date: string | null;
  status: string;
  created_at: string;
  plan_name: string;
  plan_description?: string | null;
  plan_price: number;
  plan_duration: number;
};
