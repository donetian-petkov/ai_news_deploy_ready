'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../../store/hooks';
import { FILTERED_FEED_URL } from '../../../store/constants';
import { startWsConnection, stopWsConnection } from '../../../store/wsClient';
import {
  type SchemeValue,
  type VibeValue
} from '../reactColumns.types';
import { SCHEME_LIST, VIBE_LIST } from '../reactColumns.utils';
import { useReactColumnsState } from './useReactColumnsState';
import { useFeedUiPersistence } from './useFeedUiPersistence';
import { useDesktopNewsNotifications } from './useDesktopNewsNotifications';
import { useAllColumnControlsSync } from './useAllColumnControlsSync';
import { useColumnHydration } from './useColumnHydration';
import { useFeedColumnActions } from './useFeedColumnActions';
import { useNewsItemActions } from './useNewsItemActions';
import { useNewsBodyModes } from './useNewsBodyModes';
import { useColumnDragDrop } from './useColumnDragDrop';
import { useColumnsPresentation } from './useColumnsPresentation';

type Args = {
  wsUrl: string;
};

export function useReactColumnsPreviewController({ wsUrl }: Args) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { connection, ui, feeds: feedsState, news: newsState } = useReactColumnsState();
  const { connected, status } = connection;
  const { feeds, pinnedByUrl, controlsOpenByUrl, deleteAgeByUrl, orderByUrl } = feedsState;
  const { itemsByFeed, summaryPendingById, researchPendingById, pinnedNewsById, askByItem } = newsState;

  const hydratedFeedUiRef = useRef(false);
  const [advancedControlsByUrl, setAdvancedControlsByUrl] = useState<Record<string, boolean>>({});
  const labels = useMemo(
    () => t('columns', { returnObjects: true }) as Record<string, string>,
    [t]
  );

  useEffect(() => {
    document.body.dataset.reactRenderer = '1';
    startWsConnection(dispatch, wsUrl);

    return () => {
      delete document.body.dataset.reactRenderer;
      stopWsConnection();
    };
  }, [dispatch, wsUrl]);

  useFeedUiPersistence({
    dispatch,
    feeds,
    pinnedByUrl,
    controlsOpenByUrl,
    deleteAgeByUrl,
    orderByUrl,
    hydratedRef: hydratedFeedUiRef,
    setAdvancedControlsByUrl
  });

  useDesktopNewsNotifications({
    itemsByFeed,
    notifyEnabled: ui.notifyEnabled,
    notifyMode: ui.notifyMode,
    pinnedByUrl
  });

  useAllColumnControlsSync({
    dispatch,
    allColumnControlsHidden: ui.allColumnControlsHidden,
    feedsCount: feeds.length
  });

  const renderedFeeds = useMemo(() => {
    if (feeds.length) {
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
    }

    return Object.keys(itemsByFeed).map(url => ({
      url,
      label: url,
      kind: 'rss' as const,
      intervalSec: 120,
      summaryEnabled: false,
      researchEnabled: false,
      budget: 'standard' as const,
      sortMode: 'newest' as const,
      filters: { onlyMatches: false, onlyResearched: false, onlySummaries: false }
    }));
  }, [feeds, itemsByFeed, orderByUrl]);

  const summariesLoading = useMemo(() => {
    if (!ui.aiEnabled || !ui.aiAvailable) return { count: 0, items: [] as string[] };

    const pendingIds = Object.keys(summaryPendingById);
    if (!pendingIds.length) return { count: 0, items: [] as string[] };

    const feedLabelByUrl = new Map(renderedFeeds.map(feed => [feed.url, feed.label]));
    const itemMetaById = new Map<string, { title: string; feedUrl: string }>();
    Object.entries(itemsByFeed).forEach(([feedUrl, feedItems]) => {
      if (!Array.isArray(feedItems)) return;
      feedItems.forEach(item => {
        if (!item?.id || itemMetaById.has(item.id)) return;
        itemMetaById.set(item.id, {
          title: String(item.title || '').trim(),
          feedUrl: String(item.feedUrl || feedUrl)
        });
      });
    });

    const items = pendingIds.map(id => {
      const meta = itemMetaById.get(id);
      if (!meta) return `[unknown] ${id}`;
      const feedLabel = feedLabelByUrl.get(meta.feedUrl) || meta.feedUrl;
      return `[${feedLabel}] ${meta.title || id}`;
    });

    return {
      count: pendingIds.length,
      items
    };
  }, [itemsByFeed, renderedFeeds, summaryPendingById, ui.aiAvailable, ui.aiEnabled]);

  const filteredColumnItems = useMemo(() => {
    const all = Object.values(itemsByFeed).flatMap(items => Array.isArray(items) ? items : []);
    const map = new Map<string, (typeof all)[number]>();

    all.forEach(it => {
      if (!it || !it.id || !it.isMatch || it.filteredOk === false) return;
      const prev = map.get(it.id);
      if (!prev || Number(it.publishedMs || 0) > Number(prev.publishedMs || 0)) {
        map.set(it.id, { ...it, feedUrl: FILTERED_FEED_URL });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const aPinned = !!pinnedNewsById[a.id];
      const bPinned = !!pinnedNewsById[b.id];
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return b.publishedMs - a.publishedMs;
    });
  }, [itemsByFeed, pinnedNewsById]);

  const { onGridDragOver, onGridDrop, buildDragState, columnNodesRef } = useColumnDragDrop({
    dispatch,
    renderedFeeds
  });

  const { visibleByFeed, setVisibleByFeed, hydratedColumns } = useColumnHydration({
    renderedFeeds,
    showMoreNewsAllSeq: ui.showMoreNewsAllSeq,
    resetNewsShownAllSeq: ui.resetNewsShownAllSeq,
    columnNodesRef
  });

  const {
    requestSummary,
    requestResearch,
    hideItem,
    copyLink,
    shareNews,
    copyNewsPayload,
    requestAsk,
    clipboardNoticeOpen,
    clipboardNotice,
    setClipboardNoticeOpen
  } = useNewsItemActions({
    dispatch,
    connected,
    askByItem,
    labels
  });

  const {
    removeFeed,
    toggleFeedSummary,
    toggleFeedResearch,
    setFeedBudget,
    setFeedInterval,
    setFeedSortMode,
    setFeedFilterPreset,
    removeOldInFeed
  } = useFeedColumnActions({
    dispatch,
    connected,
    deleteAgeByUrl
  });

  const { bodyModes, getBodyMode, getDefaultBodyMode, setBodyMode } = useNewsBodyModes();

  const { viewModel, stateModel, handlersModel } = useColumnsPresentation({
    dispatch,
    ui: {
      vibe: (VIBE_LIST.includes(ui.vibe as VibeValue) ? ui.vibe : 'default') as VibeValue,
      scheme: (SCHEME_LIST.includes(ui.scheme as SchemeValue) ? ui.scheme : 'classic') as SchemeValue,
      buttonMode: ui.buttonMode,
      performanceMode: ui.performanceMode,
      fontSize: ui.fontSize,
      moodFilter: ui.moodFilter,
      typeFilter: ui.typeFilter,
      searchQuery: ui.searchQuery,
      hideAllResearch: ui.hideAllResearch,
      hideAllSummaries: ui.hideAllSummaries,
      aiEnabled: ui.aiEnabled,
      aiAvailable: ui.aiAvailable
    },
    labels,
    connected,
    filteredColumnItems,
    itemsByFeed,
    visibleByFeed,
    hydratedColumns,
    pinnedByUrl,
    controlsOpenByUrl,
    advancedControlsByUrl,
    deleteAgeByUrl,
    summaryPendingById,
    researchPendingById,
    pinnedNewsById,
    askByItem,
    bodyModes,
    setAdvancedControlsByUrl,
    setVisibleByFeed,
    getBodyMode,
    getDefaultBodyMode,
    setBodyMode,
    removeFeed,
    toggleFeedSummary,
    toggleFeedResearch,
    setFeedBudget,
    setFeedInterval,
    setFeedSortMode,
    setFeedFilterPreset,
    removeOldInFeed,
    copyLink,
    shareNews,
    copyNewsPayload,
    hideItem,
    requestSummary,
    requestResearch,
    requestAsk
  });

  const columnsContextValue = useMemo(
    () => ({
      header: {
        title: labels.previewTitle,
        liveLabel: labels.live,
        disconnectedLabel: labels.disconnected,
        connected,
        status,
        summariesLoadingCount: summariesLoading.count,
        summariesLoadingLabel: labels.summariesLoading,
        summariesLoadingItems: summariesLoading.items
      },
      clipboard: {
        open: clipboardNoticeOpen,
        message: clipboardNotice || labels.linkCopied,
        onClose: () => setClipboardNoticeOpen(false)
      },
      view: viewModel,
      state: stateModel,
      handlers: handlersModel,
      renderedFeeds,
      onGridDragOver,
      onGridDrop,
      buildDragState
    }),
    [buildDragState, clipboardNotice, clipboardNoticeOpen, connected, handlersModel, labels.disconnected, labels.linkCopied, labels.live, labels.previewTitle, labels.summariesLoading, onGridDragOver, onGridDrop, renderedFeeds, stateModel, status, summariesLoading.count, summariesLoading.items, viewModel]
  );

  return {
    columnsContextValue
  };
}
