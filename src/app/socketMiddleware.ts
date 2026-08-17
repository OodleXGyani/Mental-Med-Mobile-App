import { Middleware } from '@reduxjs/toolkit';
import { socketService } from '../shared/services/socketService';
import { crudEventDispatcher } from '../shared/services/crudEventDispatcher';
import { bootstrapAuth, loginHandshakeThunk, verifyOtpThunk, logout } from '../features/authentication/store/authSlice';
import type { LoginSession } from '../features/authentication/services/authService';

export const socketMiddleware: Middleware = (store) => {
  // Initialize the dispatcher with store's dispatch
  crudEventDispatcher.initialize(store.dispatch);

  const connectWithSession = (session: LoginSession | null | undefined) => {
    if (!session) return;
    let socketUrl = session.socketUrl || session.tenantUrl;
    const socketPath = session.socketPath || '/socket.io';
    const sid = session.sid;

    if (socketUrl) {
      try {
        const parsed = new URL(socketUrl);
        socketUrl = parsed.origin;
      } catch {
        // Keep as-is
      }
    }

    console.log('[SocketMiddleware] Preparing session for socket connection:\n' + JSON.stringify({
      tenantUrl: session.tenantUrl,
      rawSocketUrl: session.socketUrl,
      resolvedSocketUrl: socketUrl,
      socketPath,
      hasSid: !!sid,
    }, null, 2));

    if (socketUrl && sid) {
      socketService.connect(socketUrl, socketPath, sid);
    }
  };

  return (next) => (action: any) => {
    const result = next(action);

    if (bootstrapAuth.fulfilled.match(action)) {
      connectWithSession(action.payload);
    } else if (loginHandshakeThunk.fulfilled.match(action)) {
      if (action.payload?.step === 'AUTHENTICATED' && action.payload?.session) {
        connectWithSession(action.payload.session);
      }
    } else if (verifyOtpThunk.fulfilled.match(action)) {
      if (action.payload?.sid) {
        connectWithSession(action.payload);
      }
    } else if (action.type === logout.type) {
      socketService.disconnect();
    }

    return result;
  };
};
