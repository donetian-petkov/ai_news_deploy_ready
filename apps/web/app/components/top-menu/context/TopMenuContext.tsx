'use client';

import { createContext, useContext } from 'react';
import type { FeedInfo } from '../../../store/types';
import type { TopMenuVibe } from '../topMenu.services';

export type TopMenuContextValue = {
  labels: Record<string, string>;
  topHintAsButtons: boolean;
  isMobile: boolean;
  connected: boolean;
  status: string;
  totalTokens: number;
  language: 'en' | 'bg';
  timezone: 'system' | 'UTC' | 'Europe/Sofia' | 'Europe/London' | 'Europe/Berlin' | 'America/New_York' | 'America/Chicago' | 'America/Denver' | 'America/Los_Angeles' | 'Asia/Tokyo';
  menuItemsAsIcons: boolean;
  vibe: TopMenuVibe;
  searchLabel: string;
  addStreamLabel: string;
  controlsLabel: string;
  allColumnLabel: string;
  menuLabel: string;
  hideAllResearchLabel: string;
  hideAllSummariesLabel: string;
  orderedFeeds: FeedInfo[];
  searchVisible: boolean;
  addStreamVisible: boolean;
  onScrollToColumns: () => void;
  onOpenHelp: () => void;
  onToggleMenu: () => void;
  onToggleSearch: () => void;
  onToggleAddStream: () => void;
  onToggleControls: () => void;
  onToggleAllColumnControls: () => void;
  onToggleHideAllResearch: () => void;
  onToggleHideAllSummaries: () => void;
  onChangeVibe: (nextVibe: TopMenuVibe) => void;
  onPlayToggleSound: () => void;
  onReorderFeeds: (fromUrl: string, toUrl: string) => void;
};

export const TopMenuContext = createContext<TopMenuContextValue | null>(null);

export function useTopMenuContext(): TopMenuContextValue {
  const ctx = useContext(TopMenuContext);
  if (!ctx) {
    throw new Error('useTopMenuContext must be used within TopMenuProvider');
  }
  return ctx;
}
