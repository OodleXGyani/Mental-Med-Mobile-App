export type CartItem = {
  id: string;
  name: string;
  batch: string;
  exp: string;
  gst: number;
  price: number;
  qty: number;
  item_code?: string;
  rate?: number;
};

export type Medicine = {
  item_code: string;
  item_name: string;
  quantity?: number;
  batch?: string;
  expiry_date?: string;
  rate?: number;
  gst?: number;
  warehouse?: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
};

export type PaymentMethod = 'Cash' | 'UPI' | 'Card';

// Cart API Types
export type CartItemInput = {
  item_code: string;
  qty: number;
  rate: number;
};

export type CartResponse = {
  cart_name: string;
  customer: string;
  company: string;
  pos_profile: string;
  taxes_and_charges: null | string;
  tax_category: null | string;
  total_amount: number;
  items: CartItemAPI[];
};

export type CartItemAPI = {
  item_code: string;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
  warehouse: string;
};

export type SaveCartPayload = {
  customer: string;
  items: CartItemInput[];
};

export type SaveCartResponse = {
  cart_name: string;
  company: string;
  pos_profile: string;
  taxes_and_charges: null | string;
  tax_category: null | string;
  total_amount: number;
};

export type GetOrAssignCartPayload = {
  customer: string;
  cart_name?: string;
};

// API Response wrapper types
export type APIResponse<T> = {
  message: T;
};

export type MedicineListResponse = {
  message: {
    success: boolean;
    data?: Medicine[];
  };
};
