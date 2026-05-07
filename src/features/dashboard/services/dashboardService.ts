import { ordersService } from '../../orders/services/ordersService';
import {
  AUTH_SESSION_EXPIRED,
  isAuthSessionExpiredResponse,
} from '../../../shared/utils/auth';

export type DashboardStats = {
  todaySales: number;
  transactions: number;
  pendingOrders: number;
  lowStock: number;
  staffPresent: {
    present: number;
    total: number;
    display: string;
  };
  pendingApprovals: number;
};

export type DashboardRecentSale = {
  invoice_id: string;
  posting_date: string;
  amount: number;
  status: string;
  company: string;
  items: string[];
};

const DASHBOARD_SUMMARY_URL =
  'https://brodie-unsooty-kenny.ngrok-free.dev/api/method/erp_pharmacy.api.mobile_api.dashboard.get_dashboard_summary';

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) {
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
    const nestedMessage = (message as { message?: unknown }).message;
    const nestedError = (message as { error?: unknown }).error;

    if (typeof nestedMessage === 'string') {
      return nestedMessage;
    }

    if (typeof nestedError === 'string') {
      return nestedError;
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

export const dashboardService = {
  fetchStats: async (): Promise<DashboardStats> => {
    const response = await fetch(DASHBOARD_SUMMARY_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = await parseJsonSafely(response);

    if (!response.ok) {
      throwResponseError(
        response,
        payload,
        'Unable to load dashboard summary.',
      );
    }

    const summary = (
      payload as {
        message?: {
          today_sales?: number;
          transactions?: number;
          pending_orders?: number;
          low_stock?: number;
          staff_present?: {
            present?: number;
            total?: number;
            display?: string;
          };
          pending_approvals?: number;
        };
      } | null
    )?.message;

    return {
      todaySales: Number(summary?.today_sales ?? 0),
      transactions: Number(summary?.transactions ?? 0),
      pendingOrders: Number(summary?.pending_orders ?? 0),
      lowStock: Number(summary?.low_stock ?? 0),
      staffPresent: {
        present: Number(summary?.staff_present?.present ?? 0),
        total: Number(summary?.staff_present?.total ?? 0),
        display: summary?.staff_present?.display ?? '0/0',
      },
      pendingApprovals: Number(summary?.pending_approvals ?? 0),
    };
  },

  fetchRecentSales: async (): Promise<DashboardRecentSale[]> => {
    const response = await ordersService.fetchCustomerInvoices({
      page: 1,
      limit: 6,
      search: '',
    });

    return response.data;
  },
};
