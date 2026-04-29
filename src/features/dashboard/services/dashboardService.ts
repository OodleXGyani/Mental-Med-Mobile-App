export type DashboardStats = {
  totalSales: number;
  pendingOrders: number;
  lowStockItems: number;
};

export const dashboardService = {
  fetchStats: async (): Promise<DashboardStats> => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    return {
      totalSales: 124560,
      pendingOrders: 18,
      lowStockItems: 7,
    };
  },
};
