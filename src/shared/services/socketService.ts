import { io, Socket } from 'socket.io-client';

export type CrudEventPayload = {
  doctype: string;
  name?: string;
  action?: 'create' | 'update' | 'delete' | string;
  api_path?: string[];
  params?: Record<string, any>;
};

type CrudEventListener = (event: CrudEventPayload) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Set<CrudEventListener> = new Set();
  private currentSocketUrl: string | null = null;
  private currentSid: string | null = null;
  private currentUserEmail: string | null = null;

  public connect(socketUrl: string, socketPath: string = '/socket.io', sid?: string, userEmail?: string): void {
    if (!socketUrl) {
      console.warn('[SocketService] connect() called with empty socketUrl');
      return;
    }

    // If already connected with same params, do not re-create
    if (this.socket && this.currentSocketUrl === socketUrl && this.currentSid === sid) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return;
    }

    // Clean up existing socket if changing connection
    this.disconnect();

    this.currentSocketUrl = socketUrl;
    this.currentSid = sid ?? null;
    this.currentUserEmail = userEmail ?? null;

    let origin = '';
    let host = '';
    let siteName = '';

    try {
      const parsed = new URL(socketUrl);
      origin = parsed.origin;
      host = parsed.host;
      // If there is a namespace (e.g. /ketmeds.pharmacy.oodleslab.com), use it as the siteName.
      // Otherwise fallback to hostname.
      const pathName = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
      siteName = pathName || parsed.hostname;
    } catch {
      // ignore
    }

    console.log('[SocketService] Initiating connection with config:\n' + JSON.stringify({
      socketUrl,
      socketPath,
      origin,
      host,
      siteName,
      sid: sid ? `${sid.substring(0, 8)}...` : 'none',
    }, null, 2));

    try {
      let lastErrorLoggedTime = 0;

      this.socket = io(socketUrl, {
        // Frappe's socketio auth middleware (realtime/middlewares/authenticate.js)
        // hard-rejects any connection where the Host header's hostname doesn't
        // match the Origin header's hostname ("Invalid origin") -- and native
        // WebSocket (what socket.io upgrades to by default) does not support
        // custom headers on React Native/browsers at all, so extraHeaders below
        // is silently dropped the moment the transport upgrades. That produces
        // exactly this symptom: the initial polling handshake completes fine
        // ('connect' fires, looks healthy) but the connection that actually
        // carries ongoing events loses its auth headers and crud_events never
        // arrive. Polling-only keeps extraHeaders attached to every request.
        transports: ['polling'],
        path: socketPath,
        withCredentials: true,
        auth: sid ? { sid, token: sid } : undefined,
        query: {
          ...(siteName ? { site_name: siteName, site: siteName } : {}),
        },
        extraHeaders: {
          ...(sid ? { Cookie: `sid=${sid}; user_image=; system_user=yes;` } : {}),
          ...(origin ? { Origin: origin, Referer: origin } : {}),
          ...(host ? { Host: host, 'X-Frappe-Site-Name': host } : {}),
        },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 15000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('[SocketService] ✅ CONNECTED successfully!\n' + JSON.stringify({
          id: this.socket?.id,
          namespace: (this.socket as any)?.nsp,
          connected: this.socket?.connected,
        }, null, 2));

        if (this.currentUserEmail) {
          console.log(`[SocketService] 📡 Subscribing to rooms for user: ${this.currentUserEmail}`);
          this.socket?.emit('user_subscribe', this.currentUserEmail);
          this.socket?.emit('task_subscribe', this.currentUserEmail);
        }

        // Subscribe to relevant Doctypes to receive their crud_events.
        // Was just ['Customer', 'Sales Invoice', 'Payment Entry'] -- far
        // narrower than what this app's own features actually mutate.
        // Cross-checked against every publish_crud_event(doctype=...) call
        // reachable from this app's backend endpoints (cart.py -> POS,
        // order_flow.py -> delivery Orders tab, inventory.py -> stock
        // adjustments, staff_management.py -> Attendance).
        const doctypes = [
          'Customer',
          'Sales Invoice',
          'Payment Entry',
          'Eph POS Cart',
          'Mobile Order Flow',
          'Stock Entry',
          'Item Price',
          'Item',
          'Attendance',
          'Employee Checkin',
          'Leave Application',
        ];
        doctypes.forEach((doctype) => {
          console.log(`[SocketService] 📡 Subscribing to doctype: ${doctype}`);
          this.socket?.emit('doctype_subscribe', doctype);
        });
      });

      this.socket.on('connect_error', (error: any) => {
        const now = Date.now();
        if (now - lastErrorLoggedTime > 5000) {
          lastErrorLoggedTime = now;
          console.warn('[SocketService] ❌ Connection error details:\n' + JSON.stringify({
            message: error?.message,
            description: error?.description,
            type: error?.type,
            context: error?.context,
            data: error?.data,
            targetUrl: socketUrl,
            path: socketPath,
          }, null, 2));
        }
      });

      // Manager-level events
      this.socket.io.on('reconnect_attempt', (attempt) => {
        console.log(`[SocketService] 🔄 Reconnect attempt #${attempt} to ${socketUrl}`);
      });

      this.socket.io.on('reconnect_failed', () => {
        console.error('[SocketService] 🚫 Reconnection failed after all attempts.');
      });

      this.socket.io.on('error', (err: any) => {
        console.warn('[SocketService] ⚠️ Manager error:\n' + JSON.stringify({
          message: err?.message,
          description: err?.description,
          type: err?.type,
        }, null, 2));
      });

      this.socket.on('disconnect', (reason, description) => {
        console.log('[SocketService] 🔌 Disconnected:\n' + JSON.stringify({ reason, description }, null, 2));
      });

      // Catch-all logger for ANY incoming event/signal from backend
      this.socket.onAny((eventName: string, ...args: any[]) => {
        console.log(`[SocketService] 📡 Received event '${eventName}':`, JSON.stringify(args, null, 2));
      });

      // Frappe backend emits 'crud_event'
      this.socket.on('crud_event', (payload: any) => {
        console.log('[SocketService] ⚡ Received crud_event:', payload);
        this.emitToListeners(payload);
      });

      // Some Frappe real-time setups also use 'msg' or generic event name
      this.socket.on('msg', (payload: any) => {
        if (payload && (payload.api_path || payload.doctype)) {
          console.log('[SocketService] ⚡ Received msg with crud data:', payload);
          this.emitToListeners(payload);
        }
      });
    } catch (err) {
      console.error('[SocketService] 💥 Failed to initialize socket:', err);
    }
  }

  private emitToListeners(rawPayload: any): void {
    if (!rawPayload || typeof rawPayload !== 'object') {
      return;
    }

    const payload: CrudEventPayload = {
      doctype: rawPayload.doctype || '',
      name: rawPayload.name || rawPayload.docname,
      action: rawPayload.action,
      api_path: Array.isArray(rawPayload.api_path)
        ? rawPayload.api_path
        : typeof rawPayload.api_path === 'string'
        ? [rawPayload.api_path]
        : [],
      params: rawPayload.params || {},
    };

    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (e) {
        console.error('[SocketService] Error in crud_event listener:', e);
      }
    });
  }

  public onCrudEvent(listener: CrudEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public removeCrudEventListener(listener: CrudEventListener): void {
    this.listeners.delete(listener);
  }

  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  public disconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Disconnecting socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentSocketUrl = null;
    this.currentSid = null;
  }
}

export const socketService = new SocketService();
