import { CrudEventPayload, socketService } from './socketService';
import type { AppDispatch } from '../../app/store';
import { fetchDashboardData } from '../../features/dashboard/store/dashboardSlice';

export type PathListener = (event: CrudEventPayload) => void;

class CrudEventDispatcher {
  private customListeners: Map<string, Set<PathListener>> = new Map();
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private dispatch: AppDispatch | null = null;
  private unsubscribeSocket: (() => void) | null = null;

  public initialize(dispatch: AppDispatch): void {
    this.dispatch = dispatch;
    if (!this.unsubscribeSocket) {
      this.unsubscribeSocket = socketService.onCrudEvent((event) => {
        this.handleEvent(event);
      });
    }
  }

  public cleanup(): void {
    if (this.unsubscribeSocket) {
      this.unsubscribeSocket();
      this.unsubscribeSocket = null;
    }
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    this.customListeners.clear();
    this.dispatch = null;
  }

  /**
   * Subscribe a component or screen directly to specific api_paths
   */
  public subscribeToPath(apiPath: string, listener: PathListener): () => void {
    if (!this.customListeners.has(apiPath)) {
      this.customListeners.set(apiPath, new Set());
    }
    this.customListeners.get(apiPath)!.add(listener);

    return () => {
      const set = this.customListeners.get(apiPath);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.customListeners.delete(apiPath);
        }
      }
    };
  }

  private handleEvent(event: CrudEventPayload): void {
    const paths = event.api_path || [];
    if (paths.length === 0 && event.doctype) {
      // Fallback: Check if doctype matches known patterns
      this.handleDoctypeFallback(event);
      return;
    }

    paths.forEach((path) => {
      this.triggerPathWithDebounce(path, event);
    });
  }

  private triggerPathWithDebounce(path: string, event: CrudEventPayload): void {
    // If a debounce timer already exists for this path, reset it
    const existingTimer = this.debounceTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(path);
      this.executePathUpdate(path, event);
    }, 1500); // 1.5s debounce

    this.debounceTimers.set(path, timer);
  }

  private executePathUpdate(path: string, event: CrudEventPayload): void {
    console.log(`[CrudEventDispatcher] Refetching for path: ${path} (Doc: ${event.doctype} ${event.name})`);

    // 1. Check custom listeners subscribed to this specific path
    const listeners = this.customListeners.get(path);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (e) {
          console.error(`[CrudEventDispatcher] Listener error for path ${path}:`, e);
        }
      });
    }

    // 2. Global Redux store dispatches
    if (!this.dispatch) return;

    if (
      path.includes('mobile_api.dashboard') ||
      path.includes('dashboard.all_company_sales_today') ||
      path.includes('dashboard.company_dashboard') ||
      path.includes('customer.get_customer_invoices')
    ) {
      this.dispatch(fetchDashboardData());
    }
  }

  private handleDoctypeFallback(event: CrudEventPayload): void {
    const doctype = event.doctype;
    console.log(`[CrudEventDispatcher] Handling doctype fallback for: ${doctype}`);

    if (['Sales Invoice', 'Payment Entry', 'Customer'].includes(doctype)) {
      this.triggerPathWithDebounce('erp_pharmacy.api.mobile_api.dashboard.get_dashboard_summary', event);
    }
  }
}

export const crudEventDispatcher = new CrudEventDispatcher();
