import {
  CreateCustomerRequest,
  CustomerDetails,
  CustomerDetailsResponse,
  CustomerDirectoryResponse,
  CustomerInvoicesResponse,
  CustomerListItem,
} from '../types';

const API_BASE_URL = 'https://brodie-unsooty-kenny.ngrok-free.dev/';
const CUSTOMER_API_ROOT = `${API_BASE_URL}api/method/erp_pharmacy.api.user_page.customer.customer`;

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const message = (payload as { message?: unknown }).message;

  if (typeof message === 'string') {
    return message;
  }

  if (message && typeof message === 'object') {
    const nestedError = (message as { error?: unknown }).error;
    const nestedMessage = (message as { message?: unknown }).message;

    if (typeof nestedError === 'string') {
      return nestedError;
    }

    if (typeof nestedMessage === 'string') {
      return nestedMessage;
    }
  }

  const error = (payload as { error?: unknown }).error;
  if (typeof error === 'string') {
    return error;
  }

  return fallback;
};

const normalizeCustomerList = (
  payload: CustomerDirectoryResponse | null,
): CustomerListItem[] => payload?.message?.data ?? [];

const normalizeCustomerDetails = (
  payload: CustomerDetailsResponse | null,
): CustomerDetails | null => payload?.message ?? null;

export const customerService = {
  fetchCustomers: async (): Promise<CustomerListItem[]> => {
    const response = await fetch(
      `${CUSTOMER_API_ROOT}.get_customer_directory`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const payload = (await parseJsonSafely(
      response,
    )) as CustomerDirectoryResponse | null;

    if (!response.ok) {
      throw new Error(
        getErrorMessage(payload, 'Unable to load customer list.'),
      );
    }

    return normalizeCustomerList(payload);
  },

  fetchCustomerDetails: async (
    customerCode: string,
  ): Promise<CustomerDetails> => {
    const response = await fetch(
      `${CUSTOMER_API_ROOT}.get_customer_details?customer_id=${encodeURIComponent(
        customerCode,
      )}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const payload = (await parseJsonSafely(
      response,
    )) as CustomerDetailsResponse | null;

    if (!response.ok) {
      throw new Error(
        getErrorMessage(payload, 'Unable to load customer details.'),
      );
    }

    const details = normalizeCustomerDetails(payload);

    if (!details) {
      throw new Error('Customer details not found.');
    }

    return details;
  },

  createCustomer: async (payload: CreateCustomerRequest): Promise<string> => {
    const response = await fetch(`${CUSTOMER_API_ROOT}.create_customer`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Create Customer Response Status:', response);

    const parsed = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(parsed, 'Unable to create customer.'));
    }

    if (!parsed || typeof parsed !== 'object') {
      return 'Customer created successfully.';
    }

    const message = (parsed as { message?: unknown }).message;
    if (message && typeof message === 'object') {
      const customerId = (message as { customer_id?: unknown }).customer_id;
      if (typeof customerId === 'string' && customerId.trim()) {
        return `Customer ${customerId} created successfully.`;
      }
    }

    return 'Customer created successfully.';
  },
  fetchCustomerInvoices: async (
    customerCode: string,
    page = 1,
    limit = 10,
  ): Promise<import('../types').CustomerInvoice[]> => {
    const url = `${CUSTOMER_API_ROOT}.get_customer_invoices?customer_id=${encodeURIComponent(
      customerCode,
    )}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = (await parseJsonSafely(
      response,
    )) as CustomerInvoicesResponse | null;

    if (!response.ok) {
      throw new Error(getErrorMessage(payload, 'Unable to load invoices.'));
    }

    return payload?.message?.data ?? [];
  },
};
