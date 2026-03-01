'use client';

import type { RootState } from '../../store/store';

export type AddStatus = { kind: 'info' | 'success' | 'error'; message: string } | null;
export type FeedType = 'rss' | 'reddit' | 'youtube';
export type TopMenuUiState = RootState['ui'];
export type TopMenuFocusTarget = 'search' | 'addStream';

export type TopMenuActionsResult = {
  addStream: () => void;
  toggleSearch: () => void;
  toggleAddStream: () => void;
  toggleControls: () => void;
  toggleMenu: () => void;
  toggleAllColumnControls: () => void;
  cycleTheme: () => void;
  cycleVibe: () => void;
  applyAllBudget: (budget: 'low' | 'standard' | 'high') => void;
  changeAiProvider: (provider: 'openai' | 'claude' | 'openrouter') => void;
  requestNotificationPermission: (enabled: boolean) => Promise<void>;
  resetAllNewest: () => void;
  deleteOldAllColumns: () => void;
};
