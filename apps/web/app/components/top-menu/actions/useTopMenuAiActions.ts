'use client';

import { useCallback } from 'react';
import type { TFunction } from 'i18next';
import { setAiSettings, enqueueToast } from '../../../store/slices/uiSlice';
import { setFeedBudgetSetting } from '../../../store/slices/feedsSlice';
import type { AppDispatch, RootState } from '../../../store/store';
import { sendWsMessage } from '../../../store/wsClient';
import { getProviderKeyLabel, type TopMenuAiProvider } from '../topMenu.services';

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
    const keyLabel = getProviderKeyLabel(provider);
    const promptText = t('topMenu.switchProviderPrompt', { keyLabel });
    const apiKey = window.prompt(promptText, '');
    if (apiKey === null) return;

    if (!apiKey.trim()) {
      dispatch(enqueueToast({ kind: 'error', message: labels.providerSwitchCancelled }));
      return;
    }

    const ok = sendWsMessage({ type: 'set_ai_provider', provider, apiKey: apiKey.trim() });
    if (!ok) {
      dispatch(enqueueToast({ kind: 'error', message: labels.noServerConnection }));
    }
  }, [dispatch, labels.noServerConnection, labels.providerSwitchCancelled, t]);

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
