import { CartItem, Customer } from './types';

export const customers: Customer[] = [
  { id: 'c1', name: 'Ramesh Kumar', phone: '9876543210' },
  { id: 'c2', name: 'Priya Sharma', phone: '9876543211' },
  { id: 'c3', name: 'Suresh Patel', phone: '9876543212' },
  { id: 'c4', name: 'Anita Verma', phone: '9876543213' },
];

export const scannedMedicine: CartItem = {
  id: 'm1',
  name: 'Omeprazole 20mg',
  batch: 'B2025-078',
  exp: '09/2026',
  gst: 12,
  price: 55,
  qty: 1,
};
