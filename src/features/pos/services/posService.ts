import {
  CartResponse,
  SaveCartPayload,
  SaveCartResponse,
  GetOrAssignCartPayload,
  Medicine,
  CreatePosInvoicePayload,
  CreatePosInvoiceResponse,
  CheckoutPreviewPayload,
  CheckoutPreviewResponse,
  ManagerUser,
  RequestApprovalPayload,
  RequestApprovalResponse,
  SubmitApprovalPayload,
  SubmitApprovalResponse,
  CustomerLoyaltyInfo,
  WarehouseOption,
  BatchOption,
  ItemDetailsResponse,
  ScanBarcodeResponse,
  ApplicableDiscountsPayload,
  CheckDiscountLimitPayload,
  CheckDiscountLimitResponse,
  VerifyPaymentStatusResponse,
} from '../types';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';

const CART_API_ROOT = `${API_BASE_URL}api/method/erp_pharmacy.api.user_page.cart.cart`;
const APPROVAL_API_ROOT = `${API_BASE_URL}api/method/erp_pharmacy.api.user_page.cart.approval`;
const INVENTORY_ITEMS_URL = `${API_BASE_URL}api/method/erp_pharmacy.api.inventory.get_inventory_items`;
const MEDICINE_INVENTORY_URL = `${API_BASE_URL}api/method/erp_pharmacy.api.user_page.medicine.medicine.get_medicine_inventory`;
const MANAGER_USERS_URL = `${API_BASE_URL}api/method/erp_pharmacy.api.pharmacy.get_manager_users`;
const SCAN_BARCODE_URL = `${API_BASE_URL}api/method/erpnext.stock.utils.scan_barcode`;
const RAZORPAY_API_ROOT = `${API_BASE_URL}api/method/erp_pharmacy.razorpay.api`;
const PRINT_FORMAT_URL = `${API_BASE_URL}api/method/frappe.utils.print_format.download_pdf`;

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const body = payload as { message?: unknown };
  const message = body.message;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (message && typeof message === 'object') {
    const nestedError = (message as { error?: unknown }).error;
    const nestedMessage = (message as { message?: unknown }).message;

    if (typeof nestedError === 'string' && nestedError.trim()) {
      return nestedError;
    }

    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return nestedMessage;
    }
  }

  const error = (payload as { error?: unknown }).error;
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
};

const postJson = async <T>(url: string, payload: unknown, fallbackError: string): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseBody = (await parseJsonSafely(response)) as any;

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, fallbackError));
  }

  if (responseBody?.message !== undefined && responseBody.message !== null) {
    const message = responseBody.message;
    if (typeof message === 'object' && message.success === false) {
      throw new Error(getErrorMessage(responseBody, fallbackError));
    }
    return message as T;
  }
  if (responseBody?.data !== undefined && responseBody.data !== null) {
    return responseBody.data as T;
  }
  if (typeof responseBody === 'object' && responseBody !== null) {
    return responseBody as T;
  }

  throw new Error(`Invalid response from server (${fallbackError})`);
};

const getJson = async <T>(url: string, fallbackError: string): Promise<T> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const responseBody = (await parseJsonSafely(response)) as any;

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, fallbackError));
  }

  if (responseBody?.message !== undefined) {
    return responseBody.message as T;
  }
  if (responseBody?.data !== undefined) {
    return responseBody.data as T;
  }

  return responseBody as T;
};

export const posService = {
  createDraftBill: async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    return { id: 'draft-1', total: 0 };
  },

  /**
   * Fetch customer loyalty points and redemption info
   */
  getCustomerLoyaltyInfo: async (customer: string): Promise<CustomerLoyaltyInfo> =>
    postJson<CustomerLoyaltyInfo>(
      `${CART_API_ROOT}.get_customer_loyalty_info`,
      { customer },
      'Unable to load customer loyalty info.',
    ),

  /**
   * Fetch medicines from inventory for the medicine list
   */
  fetchMedicines: async (search?: string, salt?: string): Promise<Medicine[]> => {
    try {
      const url = new URL(INVENTORY_ITEMS_URL);
      if (search) url.searchParams.set('search', search);
      if (salt) url.searchParams.set('salt', salt);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const payload = (await parseJsonSafely(response)) as any;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Unable to fetch medicines.'));
      }

      let medicinesData: any[] = [];
      if (payload?.data && Array.isArray(payload.data)) {
        medicinesData = payload.data;
      } else if (
        payload?.message &&
        typeof payload.message === 'object' &&
        payload.message.data &&
        Array.isArray(payload.message.data)
      ) {
        medicinesData = payload.message.data;
      } else if (Array.isArray(payload)) {
        medicinesData = payload;
      }

      return medicinesData.map(item => ({
        item_code: item.medicine_id || item.item_code || '',
        item_name: item.name || item.item_name || '',
        quantity: item.stock_quantity || item.quantity || 0,
        batch: item.batch_no || item.batch || '',
        expiry_date: item.expiry_date || '',
        rate: item.selling_price || item.rate || 0,
        gst: item.gst || item.gst_rate || 0,
        warehouse: item.warehouse || '',
        has_batch_no: item.has_batch_no ?? true,
      }));
    } catch (error) {
      console.error('Error fetching medicines:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch medicines');
    }
  },

  /**
   * Scan barcode to resolve item
   */
  scanBarcode: async (barcode: string): Promise<ScanBarcodeResponse> => {
    const url = new URL(SCAN_BARCODE_URL);
    url.searchParams.set('barcode', barcode);
    return getJson<ScanBarcodeResponse>(url.toString(), 'Barcode not recognized.');
  },

  /**
   * Get warehouses holding stock for an item
   */
  getItemWarehouses: async (item_code: string): Promise<WarehouseOption[]> => {
    const url = new URL(`${CART_API_ROOT}.get_item_warehouses`);
    url.searchParams.set('item_code', item_code);
    const raw = await getJson<any>(url.toString(), 'Unable to load warehouses.');
    const list = Array.isArray(raw) ? raw : (raw?.data || raw?.warehouses || raw?.message || []);
    return list.map((w: any) => ({
      warehouse: typeof w === 'string' ? w : (w.warehouse || w.warehouse_name || w.name || w.value || ''),
      actual_qty: typeof w === 'object' ? Number(w.actual_qty ?? w.qty ?? w.stock ?? 0) : 0,
    }));
  },

  /**
   * Get batches for an item in a specific warehouse
   */
  getItemBatches: async (item_code: string, warehouse: string): Promise<BatchOption[]> => {
    const url = new URL(`${CART_API_ROOT}.get_item_batches`);
    url.searchParams.set('item_code', item_code);
    url.searchParams.set('warehouse', warehouse);
    const raw = await getJson<any>(url.toString(), 'Unable to load batches.');
    const list = Array.isArray(raw) ? raw : (raw?.data || raw?.batches || raw?.message || []);
    return list.map((b: any) => ({
      batch_no: typeof b === 'string' ? b : (b.batch_no || b.batch_id || b.batch || b.name || b.value || ''),
      expiry_date: typeof b === 'object' ? (b.expiry_date || b.exp_date || b.exp || '') : '',
      actual_qty: typeof b === 'object' ? Number(b.actual_qty ?? b.qty ?? b.stock ?? 0) : 0,
    }));
  },

  getItemDetails: async (
    item_code: string,
    warehouse: string,
    batch_no?: string,
  ): Promise<ItemDetailsResponse> => {
    try {
      const payload: Record<string, any> = { item_code, warehouse };
      if (batch_no && batch_no.trim()) {
        payload.batch_no = batch_no.trim();
      }
      const raw = await postJson<any>(
        `${CART_API_ROOT}.get_item_details`,
        payload,
        'Unable to load item details.',
      );
      const data = raw?.data || raw || {};
      return {
        rate: Number(data.rate ?? data.selling_price ?? data.price ?? 0),
        mrp: Number(data.mrp ?? data.max_retail_price ?? 0),
        actual_qty: Number(data.actual_qty ?? data.stock_qty ?? data.quantity ?? 0),
        batch_qty: Number(data.batch_qty ?? data.batch_actual_qty ?? 0),
        expiry_date: data.expiry_date || data.exp_date || '',
        has_batch_no: data.has_batch_no ?? true,
        has_serial_no: data.has_serial_no ?? false,
        item_name: data.item_name || data.medicine_name || '',
        uom: data.uom || data.stock_uom || 'Strip',
        prescription_required: Boolean(
          data.prescription_required ||
            data.is_prescription_required ||
            data.is_rx ||
            data.schedule_drug,
        ),
        conversion_factor: Number(data.conversion_factor ?? 1),
      };
    } catch (err: any) {
      if (batch_no && (err?.message?.includes('Invalid batch') || err?.message?.includes('batch'))) {
        return posService.getItemDetails(item_code, warehouse, undefined);
      }
      throw err;
    }
  },

  /**
   * Get or assign cart for a customer
   */
  getOrAssignCart: async (payload: GetOrAssignCartPayload): Promise<CartResponse> => {
    const cleanPayload: Record<string, any> = {
      customer: payload.customer,
    };
    if (payload.cart_name && payload.cart_name.trim()) {
      cleanPayload.cart_name = payload.cart_name.trim();
    }
    return postJson<CartResponse>(
      `${CART_API_ROOT}.get_or_assign_cart`,
      cleanPayload,
      'Unable to get or assign cart.',
    );
  },

  /**
   * Save cart with items for a customer
   */
  saveCart: async (payload: SaveCartPayload): Promise<SaveCartResponse> =>
    postJson<SaveCartResponse>(
      `${CART_API_ROOT}.save_cart`,
      payload,
      'Unable to save cart.',
    ),

  /**
   * Auto-discount rules preview
   */
  getApplicableDiscounts: async (payload: ApplicableDiscountsPayload): Promise<any> =>
    postJson<any>(
      `${APPROVAL_API_ROOT}.get_applicable_discounts`,
      payload,
      'Unable to fetch applicable discounts.',
    ),

  /**
   * Check if manual discount exceeds user's role limit
   */
  checkDiscountLimit: async (
    payload: CheckDiscountLimitPayload,
  ): Promise<CheckDiscountLimitResponse> =>
    postJson<CheckDiscountLimitResponse>(
      `${APPROVAL_API_ROOT}.check_discount_limit`,
      payload,
      'Unable to verify discount limits.',
    ),

  /**
   * Server-computed totals + approval gates (discount / prescription / margin)
   */
  checkoutPreview: async (payload: CheckoutPreviewPayload): Promise<CheckoutPreviewResponse> =>
    postJson<CheckoutPreviewResponse>(
      `${CART_API_ROOT}.checkout_preview`,
      payload,
      'Unable to load checkout preview.',
    ),

  /** Managers eligible to approve a PIN-based override */
  getManagerUsers: async (search?: string): Promise<ManagerUser[]> => {
    try {
      const url = new URL(MANAGER_USERS_URL);
      if (search) url.searchParams.set('search', search);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const responseBody = (await parseJsonSafely(response)) as any;
      if (!response.ok) {
        throw new Error(getErrorMessage(responseBody, 'Unable to load managers.'));
      }
      const data = responseBody?.message?.data ?? responseBody?.message ?? [];
      return Array.isArray(data) ? (data as ManagerUser[]) : [];
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to load managers');
    }
  },

  /** Creates a Pending Manager Approval Log */
  requestApproval: async (payload: RequestApprovalPayload): Promise<RequestApprovalResponse> =>
    postJson<RequestApprovalResponse>(
      `${APPROVAL_API_ROOT}.request_approval`,
      payload,
      'Unable to request override.',
    ),

  /** Manager enters their PIN to approve a pending override */
  submitApproval: async (payload: SubmitApprovalPayload): Promise<SubmitApprovalResponse> =>
    postJson<SubmitApprovalResponse>(
      `${APPROVAL_API_ROOT}.submit_approval`,
      payload,
      'Unable to submit approval.',
    ),

  /**
   * Finalize a cart into a real Sales Invoice + payment.
   */
  createPosInvoice: async (
    payload: CreatePosInvoicePayload,
  ): Promise<CreatePosInvoiceResponse> =>
    postJson<CreatePosInvoiceResponse>(
      `${CART_API_ROOT}.create_pos_invoice`,
      payload,
      'Unable to complete the sale.',
    ),

  /**
   * Poll status of an Online Razorpay payment link
   */
  verifyPaymentLinkStatus: async (invoice: string): Promise<VerifyPaymentStatusResponse> =>
    postJson<VerifyPaymentStatusResponse>(
      `${RAZORPAY_API_ROOT}.verify_payment_link_status`,
      { invoice },
      'Unable to verify payment status.',
    ),

  /**
   * Direct PDF download helper
   */
  downloadInvoicePdf: async (invoice: string): Promise<any> =>
    postJson<any>(
      PRINT_FORMAT_URL,
      { doctype: 'Sales Invoice', name: invoice },
      'Unable to download PDF.',
    ),
};
