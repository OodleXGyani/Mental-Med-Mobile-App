import {
  AdjustStockPayload,
  InventoryItem,
  InventoryListResponse,
  BarcodeScannedItem,
  Medicine,
} from '../types';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';

const INVENTORY_ITEMS_URL = `${API_BASE_URL}api/method/erp_pharmacy.api.inventory.get_inventory_items`;
const ADJUST_STOCK_URL = `${API_BASE_URL}api/method/erp_pharmacy.api.inventory.adjust_stock`;
const BARCODE_SCAN_URL = `${API_BASE_URL}api/method/erpnext.stock.utils.scan_barcode`;
// "Quick Add Medicine" creates a pending Eph Item Request (same doctype and
// same generic REST-insert pattern the web frontend already uses for its
// own "Add Medicine" request flow -- POST /resource/Eph Item Request),
// not a live Item directly. This used to post to /resource/Item with
// field names that don't exist on either doctype (standard_selling_rate,
// standard_cost, warehouse_location, margin_percent), so most of the form
// silently vanished on save, and the "Submit for Approval" label lied --
// no approval step existed for a direct Item write anyway.
const ADD_MEDICINE_URL = `${API_BASE_URL}api/resource/Eph Item Request`;

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

  addMedicine: async (
    medicine: Omit<Medicine, 'id' | 'status'>,
  ): Promise<string> => {
    let response: Response;

    try {
      // Field names verified against the real Eph Item Request doctype
      // schema and its validate_* methods
      // (erp_pharmacy/doctype/eph_item_request/eph_item_request.py) -- the
      // rate/pack_type/supplier/manufacturing_date fields below are all
      // individually enforced server-side (validate_rates/validate_pack_type/
      // validate_supplier/validate_batch), not just declared on the schema,
      // so omitting any of them fails the request outright rather than
      // silently dropping data the way the old wrong field names did.
      // rackshelf_no is intentionally omitted: it's a Link to "Eph Rack
      // Location", not free text, and this form only collects a plain
      // string -- sending an arbitrary string there would fail link
      // validation. The reviewing admin sets it during approval instead.
      const payload = {
        item_code: medicine.name,
        item_name: medicine.name,
        item_group: 'Medicines',
        stock_uom: 'Nos',
        opening_stock: medicine.quantity,
        valuation_rate: medicine.purchaseRate,
        standard_rate: medicine.saleRate,
        description: medicine.genericName,
        gst_hsn_code: medicine.hsnSacCode,
        gst_tax_slab: medicine.gst,
        mrp: medicine.mrp,
        barcode: medicine.barcode,
        batch_no: medicine.batch,
        manufacturing_date: medicine.manufacturingDate,
        expiry_date: medicine.expiryDate,
        min_order_qty: medicine.minQuantity,
        // margin is recomputed server-side from valuation_rate/standard_rate
        // (validate_rates) regardless of what's sent -- included anyway for
        // consistency with the rest of the payload.
        margin: medicine.margin,
        pack_type: medicine.packType,
        tabs_per_strip_units_per_pack: medicine.unitsPerPack || 0,
        strips_per_box_packs_per_carton: medicine.packsPerCarton || 0,
        primary_supplier: medicine.primarySupplier,
      };

      response = await fetch(ADD_MEDICINE_URL, {
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
          `Failed to add medicine (${response.status}).`,
        ),
      );
    }

    if (!responseBody || typeof responseBody !== 'object') {
      throw new Error('Unexpected response from the server.');
    }

    // This is now a pending Eph Item Request, not a live Item -- the
    // message should say so rather than implying the medicine is already
    // in inventory.
    return 'Medicine request submitted for approval!';
  },
};
