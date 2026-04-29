import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Medicine, StockTransaction } from '../types';

type InventoryState = {
  medicines: Medicine[];
  transactions: StockTransaction[];
  lowStockCount: number;
};

const sampleMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    barcode: 'PARA-500-001',
    batch: 'B2025-001',
    expiryDate: '2026-12-31',
    rackLocation: 'A1-01',
    quantity: 150,
    minQuantity: 20,
    mrp: 25,
    purchaseRate: 18,
    margin: 28.0,
    gst: 12,
    status: 'In Stock',
  },
  {
    id: '2',
    name: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    barcode: 'AMOX-250-001',
    batch: 'B2025-045',
    expiryDate: '2026-06-30',
    rackLocation: 'A2-03',
    quantity: 8,
    minQuantity: 20,
    mrp: 85,
    purchaseRate: 60,
    margin: 41.67,
    gst: 12,
    status: 'Low',
  },
  {
    id: '3',
    name: 'Cetirizine 10mg',
    genericName: 'Cetirizine',
    barcode: 'CETI-10-001',
    batch: 'B2025-102',
    expiryDate: '2025-05-31',
    rackLocation: 'B1-02',
    quantity: 45,
    minQuantity: 20,
    mrp: 35,
    purchaseRate: 25,
    margin: 40.0,
    gst: 12,
    status: 'In Stock',
  },
  {
    id: '4',
    name: 'Metformin 500mg',
    genericName: 'Metformin',
    barcode: 'METF-500-001',
    batch: 'B2025-067',
    expiryDate: '2025-03-15',
    rackLocation: 'C2-05',
    quantity: 6,
    minQuantity: 25,
    mrp: 70,
    purchaseRate: 50,
    margin: 40.0,
    gst: 12,
    status: 'Critical',
  },
];

const initialState: InventoryState = {
  medicines: sampleMedicines,
  transactions: [],
  lowStockCount: sampleMedicines.filter(
    m => m.status === 'Low' || m.status === 'Critical',
  ).length,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setLowStockCount: (state, action: PayloadAction<number>) => {
      state.lowStockCount = action.payload;
    },
    addMedicine: (state, action: PayloadAction<Medicine>) => {
      state.medicines.push(action.payload);
      updateLowStockCount(state);
    },
    updateMedicineQuantity: (
      state,
      action: PayloadAction<{
        medicineId: string;
        quantity: number;
        reason: string;
        type: 'add' | 'remove';
      }>,
    ) => {
      const medicine = state.medicines.find(
        m => m.id === action.payload.medicineId,
      );
      if (medicine) {
        const prevQty = medicine.quantity;
        if (action.payload.type === 'add') {
          medicine.quantity += action.payload.quantity;
        } else {
          medicine.quantity = Math.max(
            0,
            medicine.quantity - action.payload.quantity,
          );
        }

        // Update status based on quantity and expiry
        updateMedicineStatus(medicine);

        // Add transaction
        state.transactions.push({
          id: `${Date.now()}`,
          medicineId: action.payload.medicineId,
          type: action.payload.type,
          quantity: action.payload.quantity,
          reason: action.payload.reason,
          timestamp: new Date().toISOString(),
        });

        updateLowStockCount(state);
      }
    },
    deleteMedicine: (state, action: PayloadAction<string>) => {
      state.medicines = state.medicines.filter(m => m.id !== action.payload);
      updateLowStockCount(state);
    },
  },
});

function updateMedicineStatus(medicine: Medicine) {
  const today = new Date();
  const expiryDate = new Date(medicine.expiryDate);
  const daysToExpiry = Math.floor(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysToExpiry < 0) {
    medicine.status = 'Expired';
  } else if (daysToExpiry <= 30) {
    medicine.status = 'Expiring';
  } else if (medicine.quantity <= medicine.minQuantity / 2) {
    medicine.status = 'Critical';
  } else if (medicine.quantity <= medicine.minQuantity) {
    medicine.status = 'Low';
  } else {
    medicine.status = 'In Stock';
  }
}

function updateLowStockCount(state: InventoryState) {
  state.lowStockCount = state.medicines.filter(
    m =>
      m.status === 'Low' || m.status === 'Critical' || m.status === 'Expiring',
  ).length;
}

export const {
  setLowStockCount,
  addMedicine,
  updateMedicineQuantity,
  deleteMedicine,
} = inventorySlice.actions;
export const inventoryReducer = inventorySlice.reducer;
