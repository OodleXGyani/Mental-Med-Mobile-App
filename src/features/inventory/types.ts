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
  gst: number; // percentage
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

export type InventoryFilter = 'All' | 'Low Stock' | 'Expiring';
