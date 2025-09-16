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

export type PlanModalProps = {
  open: boolean;
  isEditing: boolean;
  form: FormState;
  previewUrl: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFieldChange: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
};


export type User = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  user_type_id?: number;
  membership_expiry?: string | null;
  created_at?: string;
  user_type?: string;

};

export type Subscribe = {
  id: number;
  member_id: number;
  plan_id: number;
  start_date: string;
  end_date?: string | null;
  status?: string;
  created_at?: string;
  plan_name?: string;
};


export type Payment = {
  id: number;
  member_id: number;
  subscribe_id?: number | null;
  amount: number;
  payment_type_id?: number | null;
  paid_at?: string;
  paidAt?: string;
  member_name?: string | null;
  plan_name?: string | null;
  payment_type?: string | null;
  card_hash?: string | null;
  created_at?: string;
  createdAt?: string;
};


export type PaymentType = {
  id: number;
  name: string;
  description?: string;
};

export type MemberRow = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  planName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  totalPaid: number;
};

export type LinkDef = {
  to: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export type PaymentRow = {
  id: number;
  memberName?: string;
  amount: number;
  planName?: string | null;
  paymentType?: string | null;
  paidAt: string;
  createdAt?: string;
  subscribeId?: number;
  member_name?: string;
  plan_id?: number;
  payment_type?: string;
};
