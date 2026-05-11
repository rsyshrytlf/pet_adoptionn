import { DependencyList, useEffect, useRef } from 'react';

export type DataArea = 'pets' | 'products' | 'orders' | 'reservations' | 'reviews' | 'all';

const DATA_CHANGED_EVENT = 'meowmyhome:data-changed';
const DATA_CHANGED_STORAGE_KEY = 'meowmyhome:data-changed-at';

interface DataChangedDetail {
  area: DataArea;
  time: number;
}

export const emitDataChanged = (area: DataArea = 'all') => {
  const detail: DataChangedDetail = { area, time: Date.now() };

  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent<DataChangedDetail>(DATA_CHANGED_EVENT, { detail }));
  localStorage.setItem(DATA_CHANGED_STORAGE_KEY, JSON.stringify(detail));
};

export const useLiveRefresh = (
  refresh: () => void | Promise<void>,
  areas: DataArea[] = ['all'],
  intervalMs = 8000,
  deps: DependencyList = [],
) => {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;

    const shouldRefresh = (area?: DataArea) => (
      !area || area === 'all' || areas.includes('all') || areas.includes(area)
    );

    const runRefresh = () => {
      if (!cancelled) void refreshRef.current();
    };

    const handleDataChanged = (event: Event) => {
      const detail = (event as CustomEvent<DataChangedDetail>).detail;
      if (shouldRefresh(detail?.area)) runRefresh();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== DATA_CHANGED_STORAGE_KEY || !event.newValue) return;
      try {
        const detail = JSON.parse(event.newValue) as DataChangedDetail;
        if (shouldRefresh(detail.area)) runRefresh();
      } catch {
        runRefresh();
      }
    };

    const handleFocus = () => runRefresh();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') runRefresh();
    };

    window.addEventListener(DATA_CHANGED_EVENT, handleDataChanged);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = window.setInterval(runRefresh, intervalMs);

    return () => {
      cancelled = true;
      window.removeEventListener(DATA_CHANGED_EVENT, handleDataChanged);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
