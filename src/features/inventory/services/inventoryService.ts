import {
  AdjustStockPayload,
  InventoryItem,
  InventoryListResponse,
  BarcodeScannedItem,
} from '../types';

const API_BASE_URL = 'https://brodie-unsooty-kenny.ngrok-free.dev/';
const INVENTORY_ITEMS_URL = `${API_BASE_URL}api/method/erp_pharmacy.api.inventory.get_inventory_items`;
const ADJUST_STOCK_URL = `${API_BASE_URL}api/method/erp_pharmacy.api.inventory.adjust_stock`;
const BARCODE_SCAN_URL = `${API_BASE_URL}api/method/erpnext.stock.utils.scan_barcode`;

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as InventoryListResponse;
  } catch {
    return text;
  }
};

const getErrorMessage = (responseBody: unknown, fallback: string) => {
  if (!responseBody || typeof responseBody !== 'object') {
    return fallback;
  }

  const body = responseBody as InventoryListResponse;
  const messageBlock = body.message;

  if (messageBlock) {
    if (typeof messageBlock.error === 'string' && messageBlock.error.trim()) {
      return messageBlock.error;
    }

    if (
      typeof messageBlock.message === 'string' &&
      messageBlock.message.trim()
    ) {
      return messageBlock.message;
    }
  }

  return fallback;
};

const normalizeInventoryResponse = (responseBody: InventoryListResponse) => {
  if (!responseBody.message?.success) {
    throw new Error(
      getErrorMessage(responseBody, 'Unable to fetch inventory items.'),
    );
  }

  return Array.isArray(responseBody.message.data)
    ? responseBody.message.data
    : [];
};

const normalizeAdjustResponse = (responseBody: InventoryListResponse) => {
  if (!responseBody.message?.success) {
    throw new Error(
      getErrorMessage(responseBody, 'Unable to adjust inventory stock.'),
    );
  }

  return responseBody.message.message ?? 'Stock adjusted successfully.';
};

export const inventoryService = {
  fetchInventoryItems: async (): Promise<InventoryItem[]> => {
    let response: Response;

    try {
      response = await fetch(INVENTORY_ITEMS_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
    } catch {
      throw new Error(
        'Network error. Please check your connection and try again.',
      );
    }

    const responseBody = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          responseBody,
          `Failed to fetch inventory items (${response.status}).`,
        ),
      );
    }

    if (!responseBody || typeof responseBody !== 'object') {
      throw new Error('Unexpected inventory response from the server.');
    }

    return normalizeInventoryResponse(responseBody as InventoryListResponse);
  },

  adjustStock: async (payload: AdjustStockPayload): Promise<string> => {
    let response: Response;

    try {
      response = await fetch(ADJUST_STOCK_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        'Network error. Please check your connection and try again.',
      );
    }

    const responseBody = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          responseBody,
          `Failed to adjust stock (${response.status}).`,
        ),
      );
    }

    if (!responseBody || typeof responseBody !== 'object') {
      throw new Error('Unexpected adjust stock response from the server.');
    }

    return normalizeAdjustResponse(responseBody as InventoryListResponse);
  },

  scanBarcode: async (
    barcode: string,
    company: string = 'Test',
  ): Promise<BarcodeScannedItem> => {
    let response: Response;

    try {
      const params = new URLSearchParams();
      params.append('search_value', barcode);
      params.append('ctx', JSON.stringify({ company }));

      response = await fetch(`${BARCODE_SCAN_URL}?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
    } catch {
      throw new Error(
        'Network error. Please check your connection and try again.',
      );
    }

    const responseBody = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          responseBody,
          `Failed to scan barcode (${response.status}).`,
        ),
      );
    }

    if (!responseBody || typeof responseBody !== 'object') {
      throw new Error('Unexpected barcode scan response from the server.');
    }

    // Extract the message from the response
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      'message' in responseBody
    ) {
      const message = (responseBody as any).message;
      if (message && typeof message === 'object') {
        return message as BarcodeScannedItem;
      }
    }

    throw new Error('Invalid barcode response format.');
  },
};
