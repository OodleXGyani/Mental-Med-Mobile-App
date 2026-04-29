export const posService = {
  createDraftBill: async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    return { id: 'draft-1', total: 0 };
  },
};
