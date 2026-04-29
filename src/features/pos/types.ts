export type CartItem = {
  id: string;
  name: string;
  batch: string;
  exp: string;
  gst: number;
  price: number;
  qty: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
};

export type PaymentMethod = 'Cash' | 'UPI' | 'Card';
