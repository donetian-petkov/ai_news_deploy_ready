'use client';

import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AppDispatch } from '../../../store/store';
import type { FeedInfo } from '../../../store/types';
import { hydrateFeedUiState } from '../../../store/slices/feedsSlice';

type FeedUiStoragePayload = {
  pinnedByUrl?: Record<string, boolean>;
  controlsOpenByUrl?: Record<string, boolean>;
  deleteAgeByUrl?: Record<string, 'yesterday' | 'week' | 'month' | 'year'>;
  orderByUrl?: string[];
};

type Args = {
  dispatch: AppDispatch;
  feeds: FeedInfo[];
  pinnedByUrl: Record<string, boolean>;
  controlsOpenByUrl: Record<string, boolean>;
  deleteAgeByUrl: Record<string, 'yesterday' | 'week' | 'month' | 'year'>;
  orderByUrl: string[];
  hydratedRef: { current: boolean };
  setAdvancedControlsByUrl: Dispatch<SetStateAction<Record<string, boolean>>>;
};

const STORAGE_KEY = 'aiNews.feedUi.v1';

export function useFeedUiPersistence({
  dispatch,
  feeds,
  pinnedByUrl,
  controlsOpenByUrl,
  deleteAgeByUrl,
  orderByUrl,
  hydratedRef,
  setAdvancedControlsByUrl
}: Args) {
  useEffect(() => {
    if (typeof window === 'undefined' || hydratedRef.current || !feeds.length) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FeedUiStoragePayload;
        dispatch(hydrateFeedUiState(parsed));
      }
    } catch {}
    hydratedRef.current = true;
  }, [dispatch, feeds.length, hydratedRef]);

  useEffect(() => {
    if (typeof window === 'undefined' || !feeds.length) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        pinnedByUrl,
        controlsOpenByUrl,
        deleteAgeByUrl,
        orderByUrl
      }));
    } catch {}
  }, [controlsOpenByUrl, deleteAgeByUrl, feeds.length, orderByUrl, pinnedByUrl]);

  useEffect(() => {
    if (!feeds.length) return;
    const feedUrlSet = new Set(feeds.map(f => f.url));
    setAdvancedControlsByUrl(prev => {
      let changed = false;
      const next: Record<string, boolean> = {};
      for (const [url, value] of Object.entries(prev)) {
        if (feedUrlSet.has(url)) next[url] = !!value;
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [feeds, setAdvancedControlsByUrl]);
}
