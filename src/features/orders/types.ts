// API response types for orders
export interface OrderAPIItemLine {
  name: string; // item_name
  qty: number;
}

export interface OrderAPIItem {
  name: string;
  workflow_state: string;
  status: string;
  current_latitude: number;
  current_longitude: number;
  customer_name: string | null;
  phone: string | null;
  total: number;
  items: OrderAPIItemLine[];
  modified: string;
}

export interface OrderAPIResponse {
  message: {
    success: boolean;
    data: OrderAPIItem[];
  };
}

export interface PerformActionPayload {
  name: string;
  action: string;
  latitude: number;
  longitude: number;
}

export type OrderActionInput =
  | 'Accept'
  | 'Reject'
  | 'Start Processing'
  | 'Mark Ready'
  | 'Dispatch'
  | 'Mark Delivered';

export type OrderRequiredCurrentState =
  | 'Pending'
  | 'Accepted'
  | 'Processing'
  | 'Ready'
  | 'Dispatched';

export interface OrderActionFlowItem {
  actionInput: OrderActionInput;
  requiredCurrentState: OrderRequiredCurrentState;
}

export interface PerformActionResponse {
  message: {
    success: boolean;
    message: string;
    // Absent on failure -- perform_action's except-branch returns
    // {success:false, message:...} with no data key at all.
    data?: {
      name: string;
      workflow_state: string;
      status: string;
    };
  };
}

export interface CustomerInvoice {
  invoice_id?: string;
  name?: string;
  posting_date: string;
  amount?: number;
  grand_total?: number;
  status: string;
  company: string;
  items: string[] | InvoiceItem[];
}

export interface InvoiceItem {
  item_name?: string;
  item_code?: string;
  batch?: string;
  expiry_date?: string;
  qty?: number;
  rate?: number;
  gst_rate?: number;
}

export interface CustomerInvoicesPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface CustomerInvoicesResponse {
  message: {
    data: CustomerInvoice[];
    pagination: CustomerInvoicesPagination;
  };
}

export interface CustomerInvoicesQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface SalesInvoiceDetailsItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  warehouse: string;
  uom: string;
  sales_order: string | null;
  sales_invoice_item: string | null;
}

export interface SalesInvoiceDetails {
  name: string;
  customer: string;
  customer_name: string;
  company: string;
  posting_date: string;
  due_date: string;
  currency: string;
  selling_price_list: string;
  debit_to: string;
  is_return: number;
  return_against: string | null;
  grand_total: number;
  net_total: number;
  total_taxes_and_charges: number;
  outstanding_amount: number;
  status: string;
  docstatus: number;
  items: SalesInvoiceDetailsItem[];
}

export interface SalesInvoiceDetailsResponse {
  message: {
    success: boolean;
    message: string;
    data: SalesInvoiceDetails | null;
    error: string | null;
  };
}

// Map workflow_state and status to internal Order type statuses.
// Rejected is a real terminal state on the backend (STATE_STATUS_MAP in
// order_flow.py) -- without its own entry here this fell through to the
// `|| 'new'` fallback in ordersService.fetchOrders, so a rejected order
// permanently reappeared in the "New" tab as if still pending, and staff
// could tap Accept/Reject on it again (which the backend then rejects).
export const statusMap: Record<
  string,
  'new' | 'accepted' | 'processing' | 'ready' | 'dispatched' | 'delivered' | 'rejected'
> = {
  Pending: 'new',
  New: 'new',
  Accept: 'accepted',
  Accepted: 'accepted',
  Processing: 'processing',
  Ready: 'ready',
  'Mark Ready': 'ready',
  Dispatch: 'dispatched',
  Dispatched: 'dispatched',
  'Out for Delivery': 'dispatched',
  'Mark Delivered': 'delivered',
  Delivered: 'delivered',
  Reject: 'rejected',
  Rejected: 'rejected',
};

export const orderActionFlow: Record<
  'new' | 'accepted' | 'processing' | 'ready' | 'dispatched' | 'delivered' | 'rejected',
  OrderActionFlowItem[]
> = {
  new: [
    { actionInput: 'Accept', requiredCurrentState: 'Pending' },
    { actionInput: 'Reject', requiredCurrentState: 'Pending' },
  ],
  accepted: [
    {
      actionInput: 'Start Processing',
      requiredCurrentState: 'Accepted',
    },
  ],
  processing: [
    { actionInput: 'Mark Ready', requiredCurrentState: 'Processing' },
  ],
  ready: [{ actionInput: 'Dispatch', requiredCurrentState: 'Ready' }],
  dispatched: [
    {
      actionInput: 'Mark Delivered',
      requiredCurrentState: 'Dispatched',
    },
  ],
  delivered: [],
  rejected: [],
};
