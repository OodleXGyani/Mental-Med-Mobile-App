import {
  CreateCustomerRequest,
  CustomerDetails,
  CustomerDetailsResponse,
  CustomerDirectoryResponse,
  CustomerInvoicesResponse,
  CustomerListItem,
  UpdateCustomerRequest,
} from '../types';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';

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

const stripHtml = (htmlStr: string): string => {
  return htmlStr
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;

  // 1. Frappe _server_messages (JSON-encoded array of message objects)
  if (typeof record._server_messages === 'string') {
    try {
      const parsedMsgs = JSON.parse(record._server_messages);
      if (Array.isArray(parsedMsgs) && parsedMsgs.length > 0) {
        const first = typeof parsedMsgs[0] === 'string' ? JSON.parse(parsedMsgs[0]) : parsedMsgs[0];
        if (first?.message && typeof first.message === 'string') {
          return stripHtml(first.message);
        }
      }
    } catch {
      // ignore JSON parse error and fallback
    }
  }

  // 2. Frappe exception string (e.g. frappe.exceptions.ValidationError: Error creating customer...)
  if (typeof record.exception === 'string') {
    const rawException = record.exception;
    const cleanException = rawException
      .replace(/^.*exceptions\.[a-zA-Z]+:\s*/, '')
      .replace(/^Error creating customer:\s*/, '');
    return stripHtml(cleanException);
  }

  const message = record.message;

  if (typeof message === 'string') {
    return stripHtml(message);
  }

  if (message && typeof message === 'object') {
    const nestedRecord = message as Record<string, unknown>;
    if (typeof nestedRecord.error === 'string') {
      return stripHtml(nestedRecord.error);
    }
    if (typeof nestedRecord.message === 'string') {
      return stripHtml(nestedRecord.message);
    }
  }

  if (typeof record.error === 'string') {
    return stripHtml(record.error);
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
  updateCustomer: async (payload: UpdateCustomerRequest): Promise<string> => {
    const response = await fetch(`${CUSTOMER_API_ROOT}.update_customer`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const parsed = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(parsed, 'Unable to update customer.'));
    }

    return 'Customer updated successfully.';
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
