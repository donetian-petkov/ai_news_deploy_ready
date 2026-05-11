'use client';

import { useCallback } from 'react';
import type { TFunction } from 'i18next';
import { setAiSettings, enqueueToast } from '../../../store/slices/uiSlice';
import { setFeedBudgetSetting } from '../../../store/slices/feedsSlice';
import type { AppDispatch, RootState } from '../../../store/store';
import { sendWsMessage } from '../../../store/wsClient';
import { getStoredAuthToken } from '../topMenuAuth.services';
import type { TopMenuAiProvider } from '../topMenu.services';

type Args = {
  dispatch: AppDispatch;
  t: TFunction;
  labels: Record<string, string>;
  feeds: RootState['feeds']['feeds'];
};

export function useTopMenuAiActions({ dispatch, t, labels, feeds }: Args) {
  const applyAllBudget = useCallback((budget: 'low' | 'standard' | 'high') => {
    const ok = sendWsMessage({ type: 'set_all_budget', budget });
    if (!ok) return;

    dispatch(setAiSettings({ allBudget: budget }));
    feeds.forEach(feed => {
      dispatch(setFeedBudgetSetting({ feedUrl: feed.url, budget }));
    });
  }, [dispatch, feeds]);

  const changeAiProvider = useCallback((provider: TopMenuAiProvider) => {
    if (provider === 'local') {
      const ok = sendWsMessage({ type: 'set_ai_provider', provider });
      if (!ok) {
        dispatch(enqueueToast({ kind: 'error', message: labels.noServerConnection }));
      }
      return;
    }
    const authToken = getStoredAuthToken();
    if (!authToken) {
      dispatch(enqueueToast({ kind: 'error', message: labels.authSignInRequired }));
      return;
    }
    const ok = sendWsMessage({ type: 'set_ai_provider', provider, authToken });
    if (!ok) {
      dispatch(enqueueToast({ kind: 'error', message: labels.noServerConnection }));
    }
  }, [dispatch, labels.authSignInRequired, labels.noServerConnection, t]);

  const requestNotificationPermission = useCallback(async (enabled: boolean) => {
    if (!enabled || typeof Notification === 'undefined') return;
    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch {}
  }, []);

  return {
    applyAllBudget,
    changeAiProvider,
    requestNotificationPermission
  };
}
