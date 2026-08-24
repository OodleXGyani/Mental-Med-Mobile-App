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

    // The web app connects to the main SaaS domain (pharmacy.oodleslab.com) 
    // with the site name as the namespace. The tenant API sometimes returns 
    // the tenant domain instead, which doesn't route socket traffic correctly.
    // We will extract the site name from tenantUrl and force it to use SAAS_BASE_URL.
    
    // session.tenantUrl is typically "https://ketmeds.pharmacy.oodleslab.com"
    const siteName = session.tenantUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // This creates exactly: "https://pharmacy.oodleslab.com/ketmeds.pharmacy.oodleslab.com"
    let socketUrl = `https://pharmacy.oodleslab.com/${siteName}`;
    
    const socketPath = session.socketPath || '/socket.io';
    const sid = session.sid;

    console.log('[SocketMiddleware] Preparing session for socket connection:\n' + JSON.stringify({
      tenantUrl: session.tenantUrl,
      rawSocketUrl: session.socketUrl,
      resolvedSocketUrl: socketUrl,
      socketPath,
      hasSid: !!sid,
    }, null, 2));

    if (socketUrl && sid) {
      socketService.connect(socketUrl, socketPath, sid, session.email);
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
