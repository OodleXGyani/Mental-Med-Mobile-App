export type CustomerListItem = {
  customer_name: string;
  customer_code: string;
  customer_type: string;
  status: string;
  contact: {
    mobile: string | null;
    email: string | null;
  };
  credit_limit: number | null;
  outstanding: number;
  total_billing: number;
  loyalty_points: number;
  last_order_date: string | null;
};

export type CustomerDirectoryResponse = {
  message: {
    data: CustomerListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
};

export type CustomerDetails = {
  customer_id: string;
  customer_name: string;
  customer_type: string;
  // get_customer_details returns "Active" if not customer.disabled else
  // "Inactive" -- this was never declared here, so the UI always showed
  // a hardcoded "Active" badge regardless of the real value.
  status: 'Active' | 'Inactive';
  credit_limit: number | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
};

export type CustomerDetailsResponse = {
  message: CustomerDetails;
};

export type CreateCustomerPayload = {
  customer_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export type CreateCustomerRequest = CreateCustomerPayload & {
  customer_type: string;
  credit_limit: number;
};

export type CustomerInvoice = {
  invoice_id: string;
  posting_date: string;
  amount: number;
  status: string;
  items: string[];
};

export type CustomerInvoicesResponse = {
  message: {
    data: CustomerInvoice[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
};
