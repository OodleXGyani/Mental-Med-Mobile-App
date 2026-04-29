export const reportsService = {
  fetchLastGeneratedAt: async (): Promise<string> => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    return new Date().toISOString();
  },
};
