export type StockStatus =
  | 'In Stock'
  | 'Low'
  | 'Critical'
  | 'Expiring'
  | 'Expired';

export type Medicine = {
  id: string;
  name: string;
  genericName: string;
  barcode: string;
  batch: string;
  expiryDate: string; // YYYY-MM-DD
  rackLocation: string;
  quantity: number;
  minQuantity: number;
  mrp: number;
  purchaseRate: number;
  margin: number; // percentage
  gst: string; // GST template name
  hsnSacCode: string;
  status: StockStatus;
};

export type StockTransaction = {
  id: string;
  medicineId: string;
  type: 'add' | 'remove';
  quantity: number;
  reason: string;
  timestamp: string;
};

export type InventoryItem = {
  medicine_id: string;
  name: string;
  category: string;
  company: string;
  warehouse: string;
  batch_no: string;
  expiry_date: string;
  days_left: number;
  quantity: number;
  stock_value: number;
  purchase_price: number;
  selling_price: number;
  reorder_level: number;
  status: string;
};

export type BarcodeScannedItem = {
  barcode: string;
  item_code: string;
  uom: string | null;
  has_batch_no: number;
  has_serial_no: number;
  default_warehouse: string;
};

export type InventoryListResponse = {
  message?: {
    success?: boolean;
    message?: string;
    data?: InventoryItem[];
    error?: string | null;
    pagination?: {
      page?: number;
      limit?: number;
      total_records?: number;
      total_pages?: number;
    };
  };
};

export type AdjustStockPayload = {
  item_code: string;
  warehouse: string;
  qty: number;
  company: string;
  batch_no: string;
  reason: string;
};

export type InventoryFilter = 'All' | 'Low Stock' | 'Expiring';
