import {
  CartResponse,
  SaveCartPayload,
  SaveCartResponse,
  GetOrAssignCartPayload,
  Medicine,
  APIResponse,
} from '../types';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';

const CART_API_ROOT = `${API_BASE_URL}api/method/erp_pharmacy.api.user_page.cart.cart`;
const INVENTORY_ITEMS_URL = `${API_BASE_URL}api/method/erp_pharmacy.api.inventory.get_inventory_items`;

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

export const posService = {
  createDraftBill: async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    return { id: 'draft-1', total: 0 };
  },

  /**
   * Fetch medicines from inventory for the medicine list
   */
  fetchMedicines: async (): Promise<Medicine[]> => {
    try {
      const response = await fetch(INVENTORY_ITEMS_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const payload = (await parseJsonSafely(response)) as any;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Unable to fetch medicines.'));
      }

      let medicinesData: any[] = [];

      // Extract medicines from response - check direct data first
      if (payload?.data && Array.isArray(payload.data)) {
        medicinesData = payload.data;
      }
      // Try nested message.data path
      else if (
        payload?.message &&
        typeof payload.message === 'object' &&
        payload.message.data &&
        Array.isArray(payload.message.data)
      ) {
        medicinesData = payload.message.data;
      }
      // If response is already an array
      else if (Array.isArray(payload)) {
        medicinesData = payload;
      }

      // Map API response fields to Medicine type
      const medicines: Medicine[] = medicinesData.map(item => ({
        item_code: item.medicine_id || item.item_code || '',
        item_name: item.name || item.item_name || '',
        quantity: item.stock_quantity || item.quantity,
        batch: item.batch_no || item.batch || '',
        expiry_date: item.expiry_date || '',
        rate: item.selling_price || item.rate,
        gst: item.gst || item.gst_rate || 0,
        warehouse: item.warehouse || '',
      }));

      console.log('Medicines fetched successfully:', medicines.length, 'items');
      return medicines;
    } catch (error) {
      console.error('Error fetching medicines:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to fetch medicines');
    }
  },

  /**
   * Get or assign cart for a customer
   */
  getOrAssignCart: async (
    payload: GetOrAssignCartPayload,
  ): Promise<CartResponse> => {
    try {
      const response = await fetch(`${CART_API_ROOT}.get_or_assign_cart`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseBody = (await parseJsonSafely(response)) as any;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(responseBody, 'Unable to get or assign cart.'),
        );
      }

      if (responseBody?.message && typeof responseBody.message === 'object') {
        return responseBody.message as CartResponse;
      }

      throw new Error('Invalid cart response from server');
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Failed to get or assign cart');
    }
  },

  /**
   * Save cart with items for a customer
   */
  saveCart: async (payload: SaveCartPayload): Promise<SaveCartResponse> => {
    try {
      const response = await fetch(`${CART_API_ROOT}.save_cart`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseBody = (await parseJsonSafely(response)) as any;

      if (!response.ok) {
        throw new Error(getErrorMessage(responseBody, 'Unable to save cart.'));
      }

      if (responseBody?.message && typeof responseBody.message === 'object') {
        return responseBody.message as SaveCartResponse;
      }

      throw new Error('Invalid save cart response from server');
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to save cart');
    }
  },
};
