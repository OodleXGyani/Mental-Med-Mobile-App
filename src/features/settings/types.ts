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
  country: string | null;
  pincode: string | null;
  // get_customer_details already returns both of these -- they just weren't
  // declared here, so the edit form had nothing to pre-fill them with.
  custom_date_of_birth: string | null;
  custom_is_chronic_patient: boolean | number | null;
};

export type CustomerDetailsResponse = {
  message: CustomerDetails;
};

// The full field set the backend (create_customer/update_customer) accepts.
// Only customer_name and customer_type are actually enforced server-side --
// which of the rest are "required" is a per-form UI choice, same as on web:
// the full Customer Master form (AddCustomerModal.jsx) requires email,
// address, city, state, country, pincode and date of birth and leaves
// contact_person/credit_limit optional, while the POS quick-add form
// (AddNewCustomerTab.jsx) only requires name + phone and never even
// collects country or date of birth. Each form enforces its own required
// set in its own validation, same as their web counterparts -- this type
// just needs to be the union of what either form can legally send.
export type CreateCustomerPayload = {
  customer_name: string;
  customer_type: string;
  contact_person?: string;
  phone: string;
  email: string;
  credit_limit?: number;
  address: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  custom_date_of_birth?: string;
  custom_is_chronic_patient?: boolean;
};

export type CreateCustomerRequest = CreateCustomerPayload;

export type UpdateCustomerRequest = Partial<CreateCustomerPayload> & {
  customer_id: string;
  status?: 'Active' | 'Inactive';
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
