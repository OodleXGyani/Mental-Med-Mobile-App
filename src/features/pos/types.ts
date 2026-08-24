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

// Checkout (create_pos_invoice) types
export type PaymentEntryInput = {
  mode: string;
  amount: number;
};

export type CreatePosInvoicePayload = {
  cart_name: string;
  payment_mode: 'Cash' | 'Online';
  payments?: PaymentEntryInput[];
  discount_value?: number;
  discount_type?: 'Percentage' | 'Amount';
  prescription?: string;
  discount_approval_log?: string;
  rx_override_log?: string;
  margin_override_log?: string;
};

export type CreatePosInvoiceResponse = {
  invoice: string;
  status: string;
  grand_total: number;
  payment_entries: string[];
  payment_link: string | null;
  print_format: string;
  print_url: string;
  loyalty_program: string | null;
  loyalty_points_redeemed: number;
  loyalty_redemption_value: number;
  loyalty_points_earned: number;
};

// Checkout preview (server-computed totals + the same three approval gates
// create_pos_invoice enforces -- mirrors the web POS's CheckoutPreviewModal)
export type CheckoutPreviewPayload = {
  cart_name: string;
  discount_value?: number;
  discount_type?: 'Percentage' | 'Amount';
};

export type PrescriptionCheck = {
  prescription_required: boolean;
  prescription_found?: boolean;
  prescription?: string | null;
  restricted_items?: string[];
};

export type MarginViolation = {
  item_code: string;
  enforcement_action: 'Block Transaction' | 'Require Admin Override' | 'Warn User' | string;
  [key: string]: unknown;
};

export type MarginCheck = {
  violations: MarginViolation[];
  requires_override: boolean;
  blocked: boolean;
};

export type CheckoutPreviewResponse = {
  net_total: number;
  taxes: number;
  grand_total: number;
  rounded_total: number;
  discount_amount: number;
  discount_approval_needed: boolean;
  discount_allowed: boolean;
  role_limit: number | null;
  loyalty_program: string | null;
  loyalty_points_redeemed: number;
  loyalty_redemption_value: number;
  loyalty_points_will_earn: number;
  prescription_check: PrescriptionCheck;
  margin_check: MarginCheck;
};

export type ManagerUser = {
  label: string;
  value: string;
};

export type ApprovalType = 'Discount Override' | 'Prescription Override' | 'Margin Override';

export type RequestApprovalPayload = {
  approval_type: ApprovalType;
  cart_name: string;
  item_code?: string;
  discount_requested?: number;
  role_limit?: number;
  override_reason?: string;
  remarks?: string;
};

export type RequestApprovalResponse = {
  approval_log: string;
  status: 'Pending';
};

export type SubmitApprovalPayload = {
  approval_log: string;
  manager_user: string;
  pin: string;
};

export type SubmitApprovalResponse = {
  success: boolean;
  message?: string;
  approval_log?: string;
  approved_by?: string;
  approval_type?: ApprovalType;
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
