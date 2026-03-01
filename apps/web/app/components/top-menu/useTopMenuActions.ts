'use client';

import { useCallback } from 'react';
import type { TFunction } from 'i18next';
import type { AppDispatch, RootState } from '../../store/store';
import { sendWsMessage } from '../../store/wsClient';
import { setAiSettings, setAppearanceSettings, setTopUiState, enqueueToast } from '../../store/slices/uiSlice';
import { setFeedBudgetSetting } from '../../store/slices/feedsSlice';
import { removeOldItemsInFeed, resetAllToNewestLimit } from '../../store/slices/newsSlice';
import { cutoffFromAge, getNextColorMode, getNextVibe, getProviderKeyLabel, type TopMenuAiProvider, type TopMenuDeleteAge } from './topMenu.services';
import type { AddStatus, FeedType } from './types';

type UseTopMenuActionsArgs = {
  dispatch: AppDispatch;
  ui: RootState['ui'];
  feeds: RootState['feeds']['feeds'];
  isMobile: boolean;
  labels: Record<string, string>;
  t: TFunction;
  feedType: FeedType;
  feedUrl: string;
  feedLabel: string;
  feedInterval: string;
  deleteAgeAll: TopMenuDeleteAge;
  setAddStatus: React.Dispatch<React.SetStateAction<AddStatus>>;
  setFeedUrl: React.Dispatch<React.SetStateAction<string>>;
  setFeedLabel: React.Dispatch<React.SetStateAction<string>>;
  setMobileDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  scheduleFocus: (target: 'search' | 'addStream', delay?: number) => void;
};

export function useTopMenuActions({
  dispatch,
  ui,
  feeds,
  isMobile,
  labels,
  t,
  feedType,
  feedUrl,
  feedLabel,
  feedInterval,
  deleteAgeAll,
  setAddStatus,
  setFeedUrl,
  setFeedLabel,
  setMobileDrawerOpen,
  scheduleFocus
}: UseTopMenuActionsArgs) {
  const addStream = useCallback(() => {
    if (!feedUrl.trim()) {
      setAddStatus({ kind: 'error', message: labels.enterValue });
      return;
    }
    setAddStatus({ kind: 'info', message: labels.adding });
    const ok = sendWsMessage({
      type: 'add_feed',
      kind: feedType,
      url: feedUrl.trim(),
      label: feedLabel.trim(),
      intervalSec: Number(feedInterval) || 120
    });
    if (!ok) {
      setAddStatus({
        kind: 'error',
        message: labels.noServerConnection
      });
      return;
    }
    setAddStatus({ kind: 'success', message: labels.streamSubmitted });
    setFeedUrl('');
    setFeedLabel('');
  }, [feedInterval, feedLabel, feedType, feedUrl, labels.adding, labels.enterValue, labels.noServerConnection, labels.streamSubmitted, setAddStatus, setFeedLabel, setFeedUrl]);

  const toggleSearch = useCallback(() => {
    const nextSearchVisible = !ui.searchVisible;
    if (isMobile) {
      setMobileDrawerOpen(true);
    }
    dispatch(setTopUiState({
      menuCollapsed: false,
      searchVisible: nextSearchVisible
    }));
    if (nextSearchVisible) {
      scheduleFocus('search', isMobile ? 80 : 30);
    }
  }, [dispatch, isMobile, scheduleFocus, setMobileDrawerOpen, ui.searchVisible]);

  const toggleAddStream = useCallback(() => {
    const nextAddStreamVisible = !ui.addStreamVisible;
    if (isMobile) {
      setMobileDrawerOpen(true);
    }
    dispatch(setTopUiState({
      menuCollapsed: false,
      addStreamVisible: nextAddStreamVisible
    }));
    if (nextAddStreamVisible) {
      scheduleFocus('addStream', isMobile ? 80 : 30);
    }
  }, [dispatch, isMobile, scheduleFocus, setMobileDrawerOpen, ui.addStreamVisible]);

  const toggleControls = useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(true);
    }
    dispatch(setTopUiState({
      menuCollapsed: false,
      controlsCollapsed: !ui.controlsCollapsed
    }));
  }, [dispatch, isMobile, setMobileDrawerOpen, ui.controlsCollapsed]);

  const toggleMenu = useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(prev => !prev);
      return;
    }
    const next = !ui.menuCollapsed;
    dispatch(setTopUiState({
      menuCollapsed: next,
      controlsCollapsed: next ? ui.controlsCollapsed : false
    }));
  }, [dispatch, isMobile, setMobileDrawerOpen, ui.controlsCollapsed, ui.menuCollapsed]);

  const toggleAllColumnControls = useCallback(() => {
    dispatch(setTopUiState({ allColumnControlsHidden: !ui.allColumnControlsHidden }));
  }, [dispatch, ui.allColumnControlsHidden]);

  const cycleTheme = useCallback(() => {
    dispatch(setAppearanceSettings({ colorMode: getNextColorMode(ui.colorMode) }));
  }, [dispatch, ui.colorMode]);

  const cycleVibe = useCallback(() => {
    dispatch(setAppearanceSettings({ vibe: getNextVibe(ui.vibe) }));
  }, [dispatch, ui.vibe]);

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
      dispatch(enqueueToast({
        kind: 'error',
        message: labels.providerSwitchCancelled
      }));
      return;
    }
    const ok = sendWsMessage({ type: 'set_ai_provider', provider, apiKey: apiKey.trim() });
    if (!ok) {
      dispatch(enqueueToast({
        kind: 'error',
        message: labels.noServerConnection
      }));
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

  const resetAllNewest = useCallback(() => {
    dispatch(resetAllToNewestLimit(10));
  }, [dispatch]);

  const deleteOldAllColumns = useCallback(() => {
    const cutoffMs = cutoffFromAge(deleteAgeAll);
    feeds.forEach(feed => {
      dispatch(removeOldItemsInFeed({ feedUrl: feed.url, cutoffMs }));
    });
  }, [deleteAgeAll, dispatch, feeds]);

  return {
    addStream,
    toggleSearch,
    toggleAddStream,
    toggleControls,
    toggleMenu,
    toggleAllColumnControls,
    cycleTheme,
    cycleVibe,
    applyAllBudget,
    changeAiProvider,
    requestNotificationPermission,
    resetAllNewest,
    deleteOldAllColumns
  };
}
