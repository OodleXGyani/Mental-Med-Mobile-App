import {
  CustomerInvoicesQuery,
  CustomerInvoicesResponse,
  OrderAPIResponse,
  PerformActionPayload,
  PerformActionResponse,
  statusMap,
} from '../types';
import type { Order } from '../components/OrderCard';
import {
  AUTH_SESSION_EXPIRED,
  isAuthSessionExpiredResponse,
} from '../../../shared/utils/auth';

const API_BASE_URL = 'https://brodie-unsooty-kenny.ngrok-free.dev/';
const ORDERS_API_ROOT = `${API_BASE_URL}api/method/erp_pharmacy.api.order_flow`;
const CUSTOMER_INVOICES_URL =
  'https://brodie-unsooty-kenny.ngrok-free.dev/api/method/erp_pharmacy.api.user_page.customer.customer.get_customer_invoices';

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
  fetchPendingOrders: async (): Promise<number> => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    return 12;
  },

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

    // Map API response to Order type
    const orders: Order[] = (payload?.message?.data ?? []).map((item, idx) => {
      console.log(`Processing order ${idx + 1}:`, item);
      // Map workflow_state to internal status
      const internalStatus = statusMap[item.workflow_state] || 'new';

      return {
        id: item.name,
        status: internalStatus,
        customer: 'Unknown', // API doesn't provide customer name, can be enhanced
        items: [], // API doesn't provide items, can be enhanced
        time: 'N/A', // API doesn't provide time info
        amount: 0, // API doesn't provide amount
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

    const result = parsed?.message?.data;
    if (!result) {
      throw new Error('Order update response missing data.');
    }

    console.log('Action performed successfully:', result);
    return result;
  },
};
