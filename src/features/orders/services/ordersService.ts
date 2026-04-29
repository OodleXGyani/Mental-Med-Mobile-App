export const ordersService = {
  fetchPendingOrders: async (): Promise<number> => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    return 12;
  },
};
