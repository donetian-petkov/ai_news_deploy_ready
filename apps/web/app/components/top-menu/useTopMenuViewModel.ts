'use client';

import { useMemo } from 'react';
import { FILTERED_FEED_URL } from '../../store/constants';
import type { FeedInfo } from '../../store/types';
import type { TopMenuContextValue } from './context/TopMenuContext';
import type { TopMenuVibe } from './topMenu.services';

type Args = {
  labels: Record<string, string>;
  topHintAsButtons: boolean;
  isMobile: boolean;
  connected: boolean;
  status: string;
  totalTokens: number;
  language: 'en' | 'bg';
  timezone: 'system' | 'UTC' | 'Europe/Sofia' | 'Europe/London' | 'Europe/Berlin' | 'America/New_York' | 'America/Chicago' | 'America/Denver' | 'America/Los_Angeles' | 'Asia/Tokyo';
  dateFormat: 'ddmmyy' | 'mmddyy' | 'yyyymmdd';
  menuItemsAsIcons: boolean;
  vibe: TopMenuVibe;
  hideAllResearch: boolean;
  hideAllSummaries: boolean;
  searchVisible: boolean;
  addStreamVisible: boolean;
  controlsCollapsed: boolean;
  menuCollapsed: boolean;
  allColumnControlsHidden: boolean;
  feeds: FeedInfo[];
  orderByUrl: string[];
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

export function useTopMenuViewModel({
  labels,
  topHintAsButtons,
  isMobile,
  connected,
  status,
  totalTokens,
  language,
  timezone,
  dateFormat,
  menuItemsAsIcons,
  vibe,
  hideAllResearch,
  hideAllSummaries,
  searchVisible,
  addStreamVisible,
  controlsCollapsed,
  menuCollapsed,
  allColumnControlsHidden,
  feeds,
  orderByUrl,
  onScrollToColumns,
  onOpenHelp,
  onToggleMenu,
  onToggleSearch,
  onToggleAddStream,
  onToggleControls,
  onToggleAllColumnControls,
  onToggleHideAllResearch,
  onToggleHideAllSummaries,
  onChangeVibe,
  onPlayToggleSound,
  onReorderFeeds
}: Args) {
  const searchLabel = searchVisible ? labels.hideSearch : labels.search;
  const addStreamLabel = addStreamVisible ? labels.hideAddStream : labels.addStream;
  const controlsLabel = controlsCollapsed ? labels.showTopControls : labels.hideTopControls;
  const allColumnLabel = allColumnControlsHidden ? labels.showAllColumnControls : labels.hideAllColumnControls;
  const menuLabel = menuCollapsed ? labels.showMenu : labels.hideMenu;

  const orderedFeeds = useMemo(() => {
    const list = [...feeds];
    const orderIndex = new Map(orderByUrl.map((url, idx) => [url, idx]));
    list.sort((a, b) => {
      const aFiltered = a.url === FILTERED_FEED_URL;
      const bFiltered = b.url === FILTERED_FEED_URL;
      if (aFiltered !== bFiltered) return aFiltered ? -1 : 1;
      const ai = orderIndex.get(a.url) ?? Number.MAX_SAFE_INTEGER;
      const bi = orderIndex.get(b.url) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
    return list;
  }, [feeds, orderByUrl]);

  const contextValue = useMemo<TopMenuContextValue>(() => ({
    labels,
    topHintAsButtons,
    isMobile,
    connected,
    status,
    totalTokens,
    language,
    timezone,
    dateFormat,
    menuItemsAsIcons,
    vibe,
    searchLabel,
    addStreamLabel,
    controlsLabel,
    allColumnLabel,
    menuLabel,
    hideAllResearchLabel: hideAllResearch ? labels.showAllResearch : labels.hideAllResearch,
    hideAllSummariesLabel: hideAllSummaries ? labels.showAllSummaries : labels.hideAllSummaries,
    orderedFeeds,
    searchVisible,
    addStreamVisible,
    onScrollToColumns,
    onOpenHelp,
    onToggleMenu,
    onToggleSearch,
    onToggleAddStream,
    onToggleControls,
    onToggleAllColumnControls,
    onToggleHideAllResearch,
    onToggleHideAllSummaries,
    onChangeVibe,
    onPlayToggleSound,
    onReorderFeeds
  }), [addStreamLabel, addStreamVisible, allColumnLabel, connected, controlsLabel, dateFormat, hideAllResearch, hideAllSummaries, isMobile, labels, language, menuItemsAsIcons, menuLabel, onChangeVibe, onOpenHelp, onPlayToggleSound, onReorderFeeds, onScrollToColumns, onToggleAddStream, onToggleAllColumnControls, onToggleControls, onToggleHideAllResearch, onToggleHideAllSummaries, onToggleMenu, onToggleSearch, orderedFeeds, searchLabel, searchVisible, status, timezone, topHintAsButtons, totalTokens, vibe]);

  return {
    searchLabel,
    addStreamLabel,
    controlsLabel,
    allColumnLabel,
    menuLabel,
    orderedFeeds,
    contextValue
  };
}
