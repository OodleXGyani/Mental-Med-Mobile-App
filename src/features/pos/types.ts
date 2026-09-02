export type CartItem = {
  id: string;
  // Stable identity for this specific cart row, separate from `id`/
  // `item_code` -- see makeLineId() in ../utils.ts. Two rows can validly
  // share an item_code (same medicine, different warehouse or batch); qty
  // +/-, remove, and "Configure Cart Item" all need to target exactly one
  // row, not every row sharing that item_code.
  line_id?: string;
  name: string;
  batch: string;
  exp: string;
  gst: number;
  price: number;
  qty: number;
  item_code?: string;
  rate?: number;
  mrp?: number;
  uom?: string;
  warehouse?: string;
  batch_no?: string;
  discount_type?: string;
  discount_value?: number;
  has_batch_no?: boolean;
  prescription_required?: boolean;
  conversion_factor?: number;
};

export type Medicine = {
  item_code: string;
  item_name: string;
  quantity?: number;
  batch?: string;
  expiry_date?: string;
  rate?: number;
  mrp?: number;
  uom?: string;
  gst?: number;
  warehouse?: string;
  has_batch_no?: boolean;
  prescription_required?: boolean;
  conversion_factor?: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  loyalty_points?: number;
  loyalty_redemption_value?: number;
};

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Online';

// Customer Loyalty Types
export type CustomerLoyaltyInfo = {
  loyalty_points: number;
  conversion_factor: number;
  redemption_value: number;
  loyalty_program: string | null;
};

// Cart API Types
export type CartItemInput = {
  item_code: string;
  qty?: number;
  quantity?: number;
  rate: number;
  warehouse?: string;
  batch_no?: string;
  discount_type?: string;
  discount_value?: number;
};

export type CartResponse = {
  cart_name: string;
  customer: string;
  company: string;
  // Was pos_profile -- the backend replaced POS Profile with a simpler,
  // per-company "Eph POS Settings" doctype this session; this response
  // field was renamed to match (see the web POS's same rename).
  pos_settings: string;
  taxes_and_charges: null | string;
  tax_category: null | string;
  total_amount: number;
  items: CartItemAPI[];
};

// Which company/warehouse/tax settings the current cashier is billing
// under -- for display on the POS billing screen, independent of any
// cart or customer existing yet.
export type ActivePosSettings = {
  company: string;
  warehouse: string;
  currency: string;
  taxes_and_charges: string;
  tax_category: string | null;
  selling_price_list: string;
};

export type CartItemAPI = {
  item_code: string;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
  warehouse: string;
  batch_no?: string;
  discount_type?: string;
  discount_value?: number;
  has_batch_no?: boolean;
};

export type SaveCartPayload = {
  customer: string;
  cart_name?: string;
  items: CartItemInput[];
  // Monotonically increasing per-device counter. The backend drops a save
  // whose client_seq is older than what's already persisted for this cart,
  // so an out-of-order network response (an earlier edit's request arriving
  // after a later one) can't silently overwrite fresher cart data -- same
  // guard the web POS uses.
  client_seq?: number;
};

export type SaveCartResponse = {
  cart_name: string;
  company: string;
  pos_settings: string;
  taxes_and_charges: null | string;
  tax_category: null | string;
  total_amount: number;
};

export type GetOrAssignCartPayload = {
  customer: string;
  cart_name?: string;
};

// Item Details (Warehouse & Batch) Types
export type WarehouseOption = {
  warehouse: string;
  actual_qty: number;
};

export type BatchOption = {
  batch_no: string;
  expiry_date: string;
  actual_qty: number;
};

export type ItemDetailsResponse = {
  rate: number;
  mrp?: number;
  actual_qty: number;
  batch_qty?: number;
  expiry_date?: string;
  has_batch_no?: boolean;
  has_serial_no?: boolean;
  item_name?: string;
  uom?: string;
  prescription_required?: boolean;
  conversion_factor?: number;
};

export type ScanBarcodeResponse = {
  item_code: string;
  batch_no?: string;
  barcode?: string;
  item_name?: string;
};

// Checkout (create_pos_invoice) types
export type PaymentEntryInput = {
  mode: string;
  amount: number;
};

export type CreatePosInvoicePayload = {
  customer?: string;
  cart_name?: string;
  payment_mode: 'Cash' | 'Online';
  payments?: PaymentEntryInput[];
  items?: any[];
  discount_value?: number;
  discount_type?: 'Percentage' | 'Amount';
  prescription?: string;
  discount_approval_log?: string;
  rx_override_log?: string;
  margin_override_log?: string;
  redeem_loyalty?: number;
  loyalty_points?: number;
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

// Checkout preview
export type CheckoutPreviewPayload = {
  cart_name: string;
  discount_value?: number;
  discount_type?: 'Percentage' | 'Amount';
  redeem_loyalty?: number;
  loyalty_points?: number;
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

export type TaxBreakupRow = {
  account_head: string;
  tax_amount: number;
  rate: number;
};

export type CheckoutPreviewResponse = {
  // Pre-discount raw sum -- the correct value for a "Subtotal" display line.
  // `net_total` below is ERPNext's post-discount, pre-tax figure: any
  // discount (auto or manual) is already baked into it, so it can't be used
  // as "the total before discount".
  subtotal: number;
  net_total: number;
  taxes: number;
  tax_breakup: TaxBreakupRow[];
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

// Discount Limits & Applicable Discounts
export type ApplicableDiscountsPayload = {
  customer: string;
  cart_name?: string;
  items: CartItemInput[];
};

export type CheckDiscountLimitPayload = {
  cart_name: string;
  discount_value: number;
  discount_type?: 'Percentage' | 'Amount';
};

export type CheckDiscountLimitResponse = {
  approval_required: boolean;
  role_limit: number | null;
  discount_allowed: boolean;
};

// Manager Approval Types
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
  discount_type?: 'Percentage' | 'Amount';
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

// Payment Verification
export type VerifyPaymentStatusResponse = {
  status: 'Pending' | 'Paid' | 'Failed' | string;
  message?: string;
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
