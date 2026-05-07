// API response types for orders
export interface OrderAPIItem {
  name: string;
  workflow_state: string;
  status: string;
  current_latitude: number;
  current_longitude: number;
}

export interface OrderAPIResponse {
  message: {
    success: boolean;
    data: OrderAPIItem[];
  };
}

export interface PerformActionPayload {
  name: string;
  action: string;
  latitude: number;
  longitude: number;
}

export type OrderActionInput =
  | 'Accept'
  | 'Reject'
  | 'Start Processing'
  | 'Mark Ready'
  | 'Dispatch'
  | 'Mark Delivered';

export type OrderRequiredCurrentState =
  | 'Pending'
  | 'Accepted'
  | 'Processing'
  | 'Ready'
  | 'Dispatched';

export interface OrderActionFlowItem {
  actionInput: OrderActionInput;
  requiredCurrentState: OrderRequiredCurrentState;
}

export interface PerformActionResponse {
  message: {
    success: boolean;
    message: string;
    data: {
      name: string;
      workflow_state: string;
      status: string;
    };
  };
}

// Map workflow_state and status to internal Order type statuses
export const statusMap: Record<
  string,
  'new' | 'accepted' | 'ready' | 'dispatched' | 'delivered'
> = {
  Pending: 'new',
  New: 'new',
  Accept: 'accepted',
  Accepted: 'accepted',
  Processing: 'processing',
  Ready: 'ready',
  'Mark Ready': 'ready',
  Dispatch: 'dispatched',
  Dispatched: 'dispatched',
  'Out for Delivery': 'dispatched',
  'Mark Delivered': 'delivered',
  Delivered: 'delivered',
};

export const orderActionFlow: Record<
  'new' | 'accepted' | 'processing' | 'ready' | 'dispatched' | 'delivered',
  OrderActionFlowItem[]
> = {
  new: [
    { actionInput: 'Accept', requiredCurrentState: 'Pending' },
    { actionInput: 'Reject', requiredCurrentState: 'Pending' },
  ],
  accepted: [
    {
      actionInput: 'Start Processing',
      requiredCurrentState: 'Accepted',
    },
  ],
  processing: [
    { actionInput: 'Mark Ready', requiredCurrentState: 'Processing' },
  ],
  ready: [{ actionInput: 'Dispatch', requiredCurrentState: 'Ready' }],
  dispatched: [
    {
      actionInput: 'Mark Delivered',
      requiredCurrentState: 'Dispatched',
    },
  ],
  delivered: [],
};
