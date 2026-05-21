import { API_BASE_URL } from '../../../shared/constants/apiConfig';

export type SalesDashboardReport = {
  filter: string;
  from_date: string;
  to_date: string;
  summary: {
    sales: number;
    transactions: number;
    avg_ticket: number;
    growth_percentage: number;
    top_product: string;
  };
  sales_chart: Array<{
    label: string;
    day?: string;
    total: number;
  }>;
  top_products: Array<{
    rank: number;
    product: string;
    qty_sold: number;
    sales: number;
  }>;
};

export const reportsService = {
  fetchSalesDashboardReport: async (
    filterType: string,
  ): Promise<SalesDashboardReport> => {
    const url = new URL(
      `${API_BASE_URL}api/method/erp_pharmacy.api.mobile_api.report.get_sales_dashboard_report`,
    );
    url.searchParams.set('filter_type', filterType);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error('Unable to load reports.');
    }

    return payload.message as SalesDashboardReport;
  },
};
