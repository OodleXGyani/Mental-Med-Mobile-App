export const inventoryService = {
  fetchLowStockCount: async (): Promise<number> => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    return 7;
  },
};
