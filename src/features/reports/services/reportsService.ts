export const reportsService = {
  fetchSalesDashboardReport: async (filterType: string) => {
    const url = new URL(
      'https://brodie-unsooty-kenny.ngrok-free.dev/api/method/erp_pharmacy.api.mobile_api.report.get_sales_dashboard_report',
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

    return payload.message as {
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
      weekly_sales: Array<{ day: string; total: number }>;
      top_products: Array<{
        rank: number;
        product: string;
        qty_sold: number;
        sales: number;
      }>;
    };
  },
};
