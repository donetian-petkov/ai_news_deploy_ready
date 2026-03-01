'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../store/hooks';
import { startWsConnection, stopWsConnection } from '../store/wsClient';
import { FILTERED_FEED_URL } from '../store/constants';
import {
  type SchemeValue,
  type VibeValue
} from './columns/reactColumns.types';
import { SCHEME_LIST, VIBE_LIST } from './columns/reactColumns.utils';
import { useReactColumnsState } from './columns/hooks/useReactColumnsState';
import { useFeedUiPersistence } from './columns/hooks/useFeedUiPersistence';
import { useDesktopNewsNotifications } from './columns/hooks/useDesktopNewsNotifications';
import { useAllColumnControlsSync } from './columns/hooks/useAllColumnControlsSync';
import { useColumnHydration } from './columns/hooks/useColumnHydration';
import { useFeedColumnActions } from './columns/hooks/useFeedColumnActions';
import { useNewsItemActions } from './columns/hooks/useNewsItemActions';
import { useNewsBodyModes } from './columns/hooks/useNewsBodyModes';
import { useColumnDragDrop } from './columns/hooks/useColumnDragDrop';
import { FeedColumnsProvider } from './columns/context/FeedColumnsProvider';
import { FeedColumnsGrid } from './columns/FeedColumnsGrid';
import { useColumnsPresentation } from './columns/hooks/useColumnsPresentation';
import { ReactColumnsHeader } from './columns/ReactColumnsHeader';
import { ClipboardNotice } from './columns/ClipboardNotice';

type Props = {
  wsUrl: string;
};

export default function ReactColumnsPreview({ wsUrl }: Props) {
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
    copyNewsPayload,
    hideItem,
    requestSummary,
    requestResearch,
    requestAsk
  });

  const columnsContextValue = useMemo(
    () => ({
      view: viewModel,
      state: stateModel,
      handlers: handlersModel,
      onGridDragOver,
      onGridDrop,
      buildDragState
    }),
    [buildDragState, handlersModel, onGridDragOver, onGridDrop, stateModel, viewModel]
  );

  return (
    <Box className="container" sx={{ pt: 1, pb: 0.5 }}>
      <ReactColumnsHeader
        title={labels.previewTitle}
        liveLabel={labels.live}
        disconnectedLabel={labels.disconnected}
        connected={connected}
        status={status}
      />

      <FeedColumnsProvider value={columnsContextValue}>
        <FeedColumnsGrid feeds={renderedFeeds} />
      </FeedColumnsProvider>

      <ClipboardNotice
        open={clipboardNoticeOpen}
        message={clipboardNotice || labels.linkCopied}
        onClose={() => setClipboardNoticeOpen(false)}
      />
    </Box>
  );
}
