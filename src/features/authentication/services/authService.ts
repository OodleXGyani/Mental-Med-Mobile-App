export type LoginPayload = {
  username: string;
  password: string;
};

export const authService = {
  login: async ({ username, password }: LoginPayload): Promise<string> => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 600));

    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    return `token-${username.toLowerCase()}`;
  },
};
