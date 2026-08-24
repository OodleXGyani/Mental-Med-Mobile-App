import {
  CustomerInvoicesQuery,
  CustomerInvoicesResponse,
  OrderAPIResponse,
  PerformActionPayload,
  PerformActionResponse,
  SalesInvoiceDetails,
  SalesInvoiceDetailsResponse,
  statusMap,
} from '../types';
import type { Order } from '../components/OrderCard';
import {
  AUTH_SESSION_EXPIRED,
  isAuthSessionExpiredResponse,
} from '../../../shared/utils/auth';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';
import { formatTimeAgo } from '../../../shared/utils/format';

const ORDERS_API_ROOT = `${API_BASE_URL}api/method/erp_pharmacy.api.order_flow`;
const CUSTOMER_INVOICES_URL =
  `${API_BASE_URL}api/method/erp_pharmacy.api.user_page.customer.customer.get_customer_invoices`;
const SALES_INVOICE_DETAILS_URL =
  `${API_BASE_URL}api/method/erp_pharmacy.api.sales.sales_invoice.get_sales_invoice_details`;

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

const throwResponseError = (
  response: Response,
  payload: unknown,
  fallback: string,
) => {
  if (response.status === 401 || isAuthSessionExpiredResponse(payload)) {
    throw new Error(AUTH_SESSION_EXPIRED);
  }

  throw new Error(getErrorMessage(payload, fallback));
};

export const ordersService = {
  fetchOrders: async (): Promise<Order[]> => {
    const url = `${ORDERS_API_ROOT}.get_orders`;

    console.log('fetchOrders called', { url });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    console.log('Fetch Orders - Response Status:', response.status);

    const payload = (await parseJsonSafely(
      response,
    )) as OrderAPIResponse | null;

    if (!response.ok) {
      throwResponseError(response, payload, 'Unable to load orders.');
    }

    // Map API response to Order type. get_orders now actually selects
    // customer_name/phone/total/items/modified (previously it silently
    // hardcoded "Unknown"/empty items/"N/A"/0 for every order regardless
    // of the real data, even though the doctype always had these fields).
    const orders: Order[] = (payload?.message?.data ?? []).map(item => {
      // Rejected has no dedicated bucket in the tab UI -- fold it into the
      // same terminal state group "delivered" sits in rather than falling
      // back to "new" (which used to make rejected orders look pending).
      const internalStatus = statusMap[item.workflow_state] || 'rejected';

      return {
        id: item.name,
        status: internalStatus,
        customer: item.customer_name || 'Unknown',
        phone: item.phone || undefined,
        items: (item.items || []).map(line => ({
          name: line.name,
          qty: line.qty,
        })),
        time: item.modified ? formatTimeAgo(item.modified) : 'N/A',
        amount: item.total || 0,
      };
    });

    console.log('Fetched orders:', orders.length, 'items');
    return orders;
  },

  fetchCustomerInvoices: async ({
    page,
    limit,
    search = '',
  }: CustomerInvoicesQuery): Promise<{
    data: CustomerInvoicesResponse['message']['data'];
    pagination: CustomerInvoicesResponse['message']['pagination'];
  }> => {
    const url = new URL(CUSTOMER_INVOICES_URL);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('search', search);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = (await parseJsonSafely(
      response,
    )) as CustomerInvoicesResponse | null;

    if (!response.ok) {
      throwResponseError(response, payload, 'Unable to load recent sales.');
    }

    return {
      data: payload?.message?.data ?? [],
      pagination: payload?.message?.pagination ?? {
        page,
        limit,
        total: 0,
        total_pages: 1,
      },
    };
  },

  fetchSalesInvoiceDetails: async (
    invoiceName: string,
  ): Promise<SalesInvoiceDetails> => {
    const url = new URL(SALES_INVOICE_DETAILS_URL);
    url.searchParams.set('name', invoiceName);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = (await parseJsonSafely(
      response,
    )) as SalesInvoiceDetailsResponse | null;

    if (!response.ok) {
      throwResponseError(response, payload, 'Unable to load invoice details.');
    }

    if (payload?.message?.success === false) {
      throw new Error(
        payload.message.error ||
          payload.message.message ||
          'Unable to load invoice details.',
      );
    }

    const details = payload?.message?.data;
    if (!details) {
      throw new Error('Invoice details not found.');
    }

    return details;
  },

  performAction: async (
    orderName: string,
    action: string,
    latitude: number,
    longitude: number,
  ): Promise<{
    name: string;
    workflow_state: string;
    status: string;
  }> => {
    const url = `${ORDERS_API_ROOT}.perform_action`;

    const payload: PerformActionPayload = {
      name: orderName,
      action,
      latitude,
      longitude,
    };

    console.log('performAction called', { payload });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Perform Action - Response Status:', response.status);

    const parsed = (await parseJsonSafely(
      response,
    )) as PerformActionResponse | null;

    if (!response.ok) {
      throw new Error(
        getErrorMessage(parsed, 'Unable to update order status.'),
      );
    }

    // perform_action catches its own exceptions and returns
    // {success:false, message:...} with NO data key and HTTP 200 -- was
    // falling through to the generic "missing data" message below instead
    // of surfacing the real reason (e.g. an action no longer valid from
    // the order's current state).
    if (parsed?.message?.success === false) {
      throw new Error(parsed.message.message || 'Unable to update order status.');
    }

    const result = parsed?.message?.data;
    if (!result) {
      throw new Error('Order update response missing data.');
    }

    console.log('Action performed successfully:', result);
    return result;
  },
};
