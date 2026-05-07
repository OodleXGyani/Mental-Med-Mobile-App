export const AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED';

export const isAuthSessionExpiredResponse = (payload: unknown): boolean => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const message = (payload as { message?: unknown }).message;

  if (!message || typeof message !== 'object') {
    return false;
  }

  const error = (message as { error?: unknown }).error;
  const text = (message as { message?: unknown }).message;

  return error === AUTH_SESSION_EXPIRED || text === AUTH_SESSION_EXPIRED;
};
