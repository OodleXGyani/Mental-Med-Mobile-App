import { useEffect, useRef } from 'react';
import { crudEventDispatcher } from '../services/crudEventDispatcher';
import type { CrudEventPayload } from '../services/socketService';

export const useCrudEventListener = (
  apiPaths: string | string[],
  onEvent: (event: CrudEventPayload) => void,
  enabled: boolean = true,
) => {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const paths = Array.isArray(apiPaths) ? apiPaths : [apiPaths];
    const unsubs = paths.map((path) =>
      crudEventDispatcher.subscribeToPath(path, (event) => {
        onEventRef.current(event);
      }),
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [JSON.stringify(apiPaths), enabled]);
};
