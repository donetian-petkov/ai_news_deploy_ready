'use client';

import type { PropsWithChildren } from 'react';
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

const TopMenuContext = createContext<TopMenuContextValue | null>(null);

type TopMenuProviderProps = PropsWithChildren<{
  value: TopMenuContextValue;
}>;

export function TopMenuProvider({ value, children }: TopMenuProviderProps) {
  return (
    <TopMenuContext.Provider value={value}>
      {children}
    </TopMenuContext.Provider>
  );
}

export function useTopMenuContext(): TopMenuContextValue {
  const ctx = useContext(TopMenuContext);
  if (!ctx) {
    throw new Error('useTopMenuContext must be used within TopMenuProvider');
  }
  return ctx;
}

