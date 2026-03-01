'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Box, Chip, Snackbar, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../store/hooks';
import {
  removeFeedLocally,
  reorderFeeds,
  setFeedBudgetSetting,
  setFeedColumnSettings,
  setFeedDeleteAge,
  setFeedIntervalSetting,
  setFeedResearchSetting,
  setFeedSummarySetting,
  toggleFeedControls,
  togglePinned
} from '../store/slices/feedsSlice';
import {
  clearResearchForItem,
  clearResearchPending,
  enqueueAskQuestion,
  hideItemLocally,
  removeOldItemsInFeed,
  receiveAskReply,
  clearSummaryForItem,
  clearSummaryPending,
  setAskDraft,
  toggleAskOpen,
  togglePinnedNews,
  setResearchPending,
  setSummaryPending
} from '../store/slices/newsSlice';
import { sendWsMessage, startWsConnection, stopWsConnection } from '../store/wsClient';
import type { BudgetMode, FeedInfo, NewsItem, SortMode } from '../store/types';
import { FILTERED_FEED_URL } from '../store/constants';
import type { BodyMode, CardLabels, FeedColumnHandlers, FeedColumnStateModel, FeedColumnViewModel, FeedFilterPreset, SchemeValue, VibeValue } from './columns/reactColumns.types';
import { buildColumnPalette, cutoffFromAge, getVibeIcons, presetToFeedFilters, SCHEME_LIST, VIBE_LIST } from './columns/reactColumns.utils';
import { useReactColumnsState } from './columns/hooks/useReactColumnsState';
import { useFeedUiPersistence } from './columns/hooks/useFeedUiPersistence';
import { useDesktopNewsNotifications } from './columns/hooks/useDesktopNewsNotifications';
import { useAllColumnControlsSync } from './columns/hooks/useAllColumnControlsSync';
import { useColumnHydration } from './columns/hooks/useColumnHydration';
import { FeedColumnsGrid } from './columns/FeedColumnsGrid';

type Props = {
  wsUrl: string;
};

export default function ReactColumnsPreview({ wsUrl }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { connection, ui, feeds: feedsState, news: newsState } = useReactColumnsState();
  const {
    connected,
    status
  } = connection;
  const {
    vibe,
    scheme,
    buttonMode,
    performanceMode,
    fontSize,
    notifyEnabled,
    notifyMode,
    hideAllResearch,
    hideAllSummaries,
    showMoreNewsAllSeq,
    resetNewsShownAllSeq,
    aiEnabled,
    aiAvailable,
    searchQuery,
    moodFilter,
    typeFilter,
    allColumnControlsHidden
  } = ui;
  const {
    feeds,
    pinnedByUrl,
    controlsOpenByUrl,
    deleteAgeByUrl,
    orderByUrl
  } = feedsState;
  const {
    itemsByFeed,
    summaryPendingById,
    researchPendingById,
    pinnedNewsById,
    askByItem
  } = newsState;
  const pendingTimeoutsRef = useRef<Record<string, number>>({});
  const researchTimeoutsRef = useRef<Record<string, number>>({});
  const hydratedFeedUiRef = useRef(false);
  const [bodyModes, setBodyModes] = useState<Record<string, BodyMode>>({});
  const [clipboardNoticeOpen, setClipboardNoticeOpen] = useState(false);
  const [clipboardNotice, setClipboardNotice] = useState('');
  const [dragFeedUrl, setDragFeedUrl] = useState<string | null>(null);
  const [dragOverFeedUrl, setDragOverFeedUrl] = useState<string | null>(null);
  const [advancedControlsByUrl, setAdvancedControlsByUrl] = useState<Record<string, boolean>>({});
  const dragCommittedRef = useRef(false);
  const dragLastTargetRef = useRef<string | null>(null);
  const columnNodesRef = useRef<Record<string, HTMLDivElement | null>>({});
  const l = useMemo(
    () => t('columns', { returnObjects: true }) as Record<string, string>,
    [t]
  );

  useEffect(() => {
    document.body.dataset.reactRenderer = '1';
    startWsConnection(dispatch, wsUrl);

    return () => {
      delete document.body.dataset.reactRenderer;
      stopWsConnection();
      const ids = Object.keys(pendingTimeoutsRef.current);
      for (const id of ids) {
        window.clearTimeout(pendingTimeoutsRef.current[id]);
      }
      pendingTimeoutsRef.current = {};
      const rIds = Object.keys(researchTimeoutsRef.current);
      for (const id of rIds) {
        window.clearTimeout(researchTimeoutsRef.current[id]);
      }
      researchTimeoutsRef.current = {};
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
    notifyEnabled,
    notifyMode,
    pinnedByUrl
  });

  useAllColumnControlsSync({
    dispatch,
    allColumnControlsHidden,
    feedsCount: feeds.length
  });

  const previewFeeds = useMemo(() => {
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
    const fallback = Object.keys(itemsByFeed).map(url => ({
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
    return fallback;
  }, [feeds, itemsByFeed, orderByUrl]);

  const renderedFeeds = previewFeeds;

  const filteredColumnItems = useMemo(() => {
    const all = Object.values(itemsByFeed).flatMap(items => Array.isArray(items) ? items : []);
    const map = new Map<string, NewsItem>();
    all.forEach(it => {
      if (!it || !it.id) return;
      if (!it.isMatch || it.filteredOk === false) return;
      const prev = map.get(it.id);
      if (!prev || (Number(it.publishedMs || 0) > Number(prev.publishedMs || 0))) {
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

  const {
    visibleByFeed,
    setVisibleByFeed,
    hydratedColumns
  } = useColumnHydration({
    renderedFeeds,
    showMoreNewsAllSeq,
    resetNewsShownAllSeq,
    columnNodesRef
  });

  const requestSummary = (it: NewsItem) => {
    if (!connected) return;

    dispatch(setSummaryPending(it.id));
    dispatch(clearSummaryForItem({ id: it.id, feedUrl: it.feedUrl }));

    if (pendingTimeoutsRef.current[it.id]) {
      window.clearTimeout(pendingTimeoutsRef.current[it.id]);
    }
    pendingTimeoutsRef.current[it.id] = window.setTimeout(() => {
      dispatch(clearSummaryPending(it.id));
      delete pendingTimeoutsRef.current[it.id];
    }, 30000);

    const ok = sendWsMessage({
      type: 'run_summary_item',
      id: it.id,
      feedUrl: it.feedUrl
    });
    if (!ok) dispatch(clearSummaryPending(it.id));
  };

  const requestResearch = (it: NewsItem) => {
    if (!connected) return;

    dispatch(setResearchPending(it.id));
    dispatch(clearResearchForItem({ id: it.id, feedUrl: it.feedUrl }));

    if (researchTimeoutsRef.current[it.id]) {
      window.clearTimeout(researchTimeoutsRef.current[it.id]);
    }
    researchTimeoutsRef.current[it.id] = window.setTimeout(() => {
      dispatch(clearResearchPending(it.id));
      delete researchTimeoutsRef.current[it.id];
    }, 45000);

    const ok = sendWsMessage({
      type: 'run_research_item',
      id: it.id,
      feedUrl: it.feedUrl
    });
    if (!ok) dispatch(clearResearchPending(it.id));
  };

  const askKey = (it: NewsItem) => `${it.feedUrl}::${it.id}`;

  const getBodyMode = (key: string, text: string, threshold: number): BodyMode => {
    const saved = bodyModes[key];
    if (saved) return saved;
    return String(text || '').trim().length > threshold ? 'collapsed' : 'expanded';
  };
  const getDefaultBodyMode = (text: string, threshold: number): BodyMode =>
    String(text || '').trim().length > threshold ? 'collapsed' : 'expanded';

  const setBodyMode = (key: string, mode: BodyMode) => {
    setBodyModes(prev => ({ ...prev, [key]: mode }));
  };

  const hideItem = (it: NewsItem) => {
    const ok = sendWsMessage({ type: 'hide_item', id: it.id });
    if (ok) dispatch(hideItemLocally(it.id));
  };

  const copyLink = async (url: string) => {
    const value = String(url || '').trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setClipboardNotice(l.linkCopied);
      setClipboardNoticeOpen(true);
    } catch {
      window.open(value, '_blank', 'noopener,noreferrer');
    }
  };

  const copyNewsPayload = async (it: NewsItem) => {
    const title = String(it.title || '').trim();
    const summary = String(it.summary || '').trim();
    const research = String(it.research || '').trim();
    const link = String(it.link || '').trim();
    if (!title && !summary && !research && !link) return;

    const chunks: string[] = [];
    if (title) chunks.push(`${l.copiedTitle}: ${title}`);
    if (summary) chunks.push(`${l.copiedSummary}: ${summary}`);
    if (research) chunks.push(`${l.copiedResearch}: ${research}`);
    if (link) chunks.push(`${l.copiedLink}: ${link}`);
    const payload = chunks.join('\n\n');

    try {
      await navigator.clipboard.writeText(payload);
      setClipboardNotice(l.newsCopied);
      setClipboardNoticeOpen(true);
    } catch {
      if (link) window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const removeFeed = (feedUrl: string) => {
    if (!connected) return;
    const ok = sendWsMessage({ type: 'remove_feed', feedUrl });
    if (ok) dispatch(removeFeedLocally(feedUrl));
  };

  const requestAsk = (it: NewsItem) => {
    if (!connected) return;
    const k = askKey(it);
    const askState = askByItem[k] || { used: 0, remaining: 5, draft: '', pending: false };
    const question = String(askState.draft || '').trim().slice(0, 400);
    if (!question || askState.pending || askState.remaining <= 0) return;

    const usedBefore = askState.used;
    const remainingBefore = askState.remaining;
    dispatch(enqueueAskQuestion({ id: it.id, feedUrl: it.feedUrl, question }));

    const ok = sendWsMessage({
      type: 'ask_agent_item',
      id: it.id,
      feedUrl: it.feedUrl,
      question,
      researchMode: 'auto'
    });
    if (!ok) {
      dispatch(receiveAskReply({
        id: it.id,
        feedUrl: it.feedUrl,
        question,
        error: 'Socket unavailable. Try again.',
        used: usedBefore,
        remaining: remainingBefore
      }));
    }
  };

  const toggleFeedSummary = (feed: FeedInfo) => {
    if (!connected) return;
    const nextEnabled = !feed.summaryEnabled;
    const ok = sendWsMessage({ type: 'set_feed_summary', feedUrl: feed.url, enabled: nextEnabled });
    if (ok) dispatch(setFeedSummarySetting({ feedUrl: feed.url, enabled: nextEnabled }));
  };

  const toggleFeedResearch = (feed: FeedInfo) => {
    if (!connected) return;
    const nextEnabled = !feed.researchEnabled;
    const ok = sendWsMessage({ type: 'set_feed_research', feedUrl: feed.url, enabled: nextEnabled });
    if (ok) dispatch(setFeedResearchSetting({ feedUrl: feed.url, enabled: nextEnabled }));
  };

  const setFeedBudget = (feed: FeedInfo, budget: BudgetMode) => {
    if (!connected) return;
    const ok = sendWsMessage({ type: 'set_feed_budget', feedUrl: feed.url, budget });
    if (ok) dispatch(setFeedBudgetSetting({ feedUrl: feed.url, budget }));
  };

  const setFeedInterval = (feed: FeedInfo, intervalSec: number) => {
    if (!connected) return;
    const next = Math.max(20, Math.min(3600, Math.floor(intervalSec)));
    const ok = sendWsMessage({ type: 'set_feed_interval', feedUrl: feed.url, intervalSec: next });
    if (ok) dispatch(setFeedIntervalSetting({ feedUrl: feed.url, intervalSec: next }));
  };

  const setFeedSortMode = (feed: FeedInfo, sortMode: SortMode) => {
    if (!connected) return;
    const ok = sendWsMessage({
      type: 'set_feed_column_settings',
      feedUrl: feed.url,
      sortMode,
      filters: feed.filters
    });
    if (ok) dispatch(setFeedColumnSettings({ feedUrl: feed.url, sortMode }));
  };

  const setFeedFilters = (feed: FeedInfo, filters: FeedInfo['filters']) => {
    if (!connected) return;
    const ok = sendWsMessage({
      type: 'set_feed_column_settings',
      feedUrl: feed.url,
      sortMode: feed.sortMode,
      filters
    });
    if (ok) dispatch(setFeedColumnSettings({ feedUrl: feed.url, filters }));
  };

  const setFeedFilterPreset = (feed: FeedInfo, preset: FeedFilterPreset) => {
    setFeedFilters(feed, presetToFeedFilters(preset));
  };

  const removeOldInFeed = (feed: FeedInfo) => {
    const age = deleteAgeByUrl[feed.url] || 'week';
    dispatch(removeOldItemsInFeed({
      feedUrl: feed.url,
      cutoffMs: cutoffFromAge(age)
    }));
  };

  const fontScale = fontSize === 'xl' ? 1.17 : fontSize === 'lg' ? 1.09 : fontSize === 'sm' ? 0.93 : 1;
  const resolvedVibe: VibeValue = (VIBE_LIST.includes(vibe as VibeValue) ? vibe : 'default') as VibeValue;
  const resolvedScheme: SchemeValue = (SCHEME_LIST.includes(scheme as SchemeValue) ? scheme : 'classic') as SchemeValue;
  const palette = useMemo(() => buildColumnPalette(resolvedVibe, resolvedScheme), [resolvedVibe, resolvedScheme]);
  const vibeIcons = useMemo(() => getVibeIcons(resolvedVibe), [resolvedVibe]);
  const compactBtnSx = useMemo(() => ({
    minHeight: 34,
    px: 1.2,
    py: 0.18,
    fontSize: `${0.82 * fontScale}rem`,
    lineHeight: 1.15,
    borderRadius: performanceMode ? 1.2 : 999,
    whiteSpace: 'nowrap'
  }), [fontScale, performanceMode]);
  const compactFormSx = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      height: 34,
      fontSize: `${0.82 * fontScale}rem`,
      background: performanceMode ? 'rgba(10,16,29,0.98)' : 'rgba(12,20,38,0.92)',
      color: 'rgba(231,240,255,0.96)',
      borderRadius: performanceMode ? 1.2 : 999
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(122,149,194,0.44)'
    },
    '& .MuiSvgIcon-root': {
      color: 'rgba(203,217,243,0.9)'
    }
  }), [fontScale, performanceMode]);
  const cardLabels = useMemo<CardLabels>(() => ({
    pinNews: l.pinNews,
    unpinNews: l.unpinNews,
    match: l.match,
    shareLink: l.shareLink,
    copyNews: l.copyNews,
    hideNews: l.hideNews,
    generatingSummary: l.generatingSummary,
    summary: l.summary,
    researching: l.researching,
    research: l.research,
    askAgent: l.askAgent,
    showSummary: l.showSummary,
    hideSummary: l.hideSummary,
    showMore: l.showMore,
    showLess: l.showLess,
    aiUnavailable: l.aiUnavailable,
    autoResearching: l.autoResearching,
    confidence: l.confidence,
    showResearch: l.showResearch,
    hideResearch: l.hideResearch,
    questionsLeft: l.questionsLeft,
    askPlaceholder: l.askPlaceholder,
    thinking: l.thinking,
    send: l.send
  }), [l]);
  const columnViewModel = useMemo<FeedColumnViewModel>(() => ({
    palette,
    performanceMode,
    moodFilter,
    typeFilter,
    searchQuery,
    hideAllResearch,
    hideAllSummaries,
    aiEnabled,
    aiAvailable,
    buttonMode,
    fontScale,
    connected,
    compactBtnSx,
    compactFormSx,
    labels: l,
    cardLabels,
    vibeIcons
  }), [
    aiAvailable,
    aiEnabled,
    buttonMode,
    cardLabels,
    compactBtnSx,
    compactFormSx,
    connected,
    fontScale,
    hideAllResearch,
    hideAllSummaries,
    l,
    moodFilter,
    palette,
    performanceMode,
    searchQuery,
    typeFilter,
    vibeIcons
  ]);
  const columnStateModel = useMemo<FeedColumnStateModel>(() => ({
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
    bodyModes
  }), [
    advancedControlsByUrl,
    askByItem,
    bodyModes,
    controlsOpenByUrl,
    deleteAgeByUrl,
    filteredColumnItems,
    hydratedColumns,
    itemsByFeed,
    pinnedByUrl,
    pinnedNewsById,
    researchPendingById,
    summaryPendingById,
    visibleByFeed
  ]);
  const columnHandlers = useMemo<FeedColumnHandlers>(() => ({
    getBodyMode,
    getDefaultBodyMode,
    setBodyMode,
    onTogglePinnedColumn: (feedUrl: string) => dispatch(togglePinned(feedUrl)),
    onRemoveFeed: removeFeed,
    onToggleFeedControls: (feedUrl: string) => dispatch(toggleFeedControls(feedUrl)),
    onToggleFeedSummary: toggleFeedSummary,
    onToggleFeedResearch: toggleFeedResearch,
    onSetFeedBudget: setFeedBudget,
    onSetFeedInterval: setFeedInterval,
    onSetFeedSortMode: setFeedSortMode,
    onSetFeedFilterPreset: setFeedFilterPreset,
    onToggleAdvancedControls: (feedUrl: string) => setAdvancedControlsByUrl(prev => ({ ...prev, [feedUrl]: !prev[feedUrl] })),
    onSetDeleteAge: (feedUrl, age) => dispatch(setFeedDeleteAge({ feedUrl, age })),
    onRemoveOldInFeed: removeOldInFeed,
    onShowMoreNews: (feedUrl: string) => setVisibleByFeed(prev => ({ ...prev, [feedUrl]: (prev[feedUrl] || 10) + 5 })),
    onResetNewsToTen: (feedUrl: string) => setVisibleByFeed(prev => ({ ...prev, [feedUrl]: 10 })),
    onTogglePinnedNews: (id: string) => dispatch(togglePinnedNews(id)),
    onCopyLink: copyLink,
    onCopyNewsPayload: copyNewsPayload,
    onHideItem: hideItem,
    onRequestSummary: requestSummary,
    onRequestResearch: requestResearch,
    onToggleAsk: (id, feedUrl) => dispatch(toggleAskOpen({ id, feedUrl })),
    onSetAskDraft: (id, feedUrl, draft) => dispatch(setAskDraft({ id, feedUrl, draft })),
    onAskSubmit: requestAsk
  }), [
    copyLink,
    copyNewsPayload,
    dispatch,
    getBodyMode,
    getDefaultBodyMode,
    hideItem,
    removeFeed,
    removeOldInFeed,
    requestAsk,
    requestResearch,
    requestSummary,
    setBodyMode,
    setFeedBudget,
    setFeedFilterPreset,
    setFeedInterval,
    setFeedSortMode,
    setVisibleByFeed,
    toggleFeedResearch,
    toggleFeedSummary
  ]);

  const onGridDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!dragFeedUrl) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onGridDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!dragFeedUrl) return;
    if (dragCommittedRef.current) return;
    e.preventDefault();
    const fromUrl = String(
      e.dataTransfer.getData('application/x-ai-news-feed')
      || e.dataTransfer.getData('text/plain')
      || dragFeedUrl
      || ''
    ).trim();
    if (!fromUrl) return;

    const nodes = renderedFeeds
      .map(feed => ({ url: feed.url, node: columnNodesRef.current[feed.url] }))
      .filter((x): x is { url: string; node: HTMLDivElement } => !!x.node);
    if (!nodes.length) return;

    let bestUrl = nodes[0].url;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const n of nodes) {
      const rect = n.node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const d = Math.abs(e.clientX - centerX);
      if (d < bestDist) {
        bestDist = d;
        bestUrl = n.url;
      }
    }
    if (bestUrl && bestUrl !== fromUrl) {
      dispatch(reorderFeeds({ fromUrl, toUrl: bestUrl }));
    }
    dragCommittedRef.current = true;
    setDragFeedUrl(null);
    setDragOverFeedUrl(null);
    dragLastTargetRef.current = null;
  };

  const buildDragState = (feed: FeedInfo, canDrag: boolean) => ({
    canDrag,
    isDragging: dragFeedUrl === feed.url,
    isDropTarget: !!dragFeedUrl && dragFeedUrl !== feed.url && dragOverFeedUrl === feed.url,
    onDragStart: (e: DragEvent<HTMLDivElement>) => {
      if (!canDrag) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, label, [role=\"button\"]')) {
        e.preventDefault();
        return;
      }
      dragCommittedRef.current = false;
      dragLastTargetRef.current = null;
      setDragFeedUrl(feed.url);
      setDragOverFeedUrl(feed.url);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', feed.url);
      e.dataTransfer.setData('application/x-ai-news-feed', feed.url);
    },
    onDragEnd: () => {
      const fallbackTarget = dragLastTargetRef.current || dragOverFeedUrl;
      if (!dragCommittedRef.current && dragFeedUrl && fallbackTarget && dragFeedUrl !== fallbackTarget) {
        dispatch(reorderFeeds({ fromUrl: dragFeedUrl, toUrl: fallbackTarget }));
      }
      setDragFeedUrl(null);
      setDragOverFeedUrl(null);
      dragCommittedRef.current = false;
      dragLastTargetRef.current = null;
    },
    setNode: (node: HTMLDivElement | null) => {
      columnNodesRef.current[feed.url] = node;
    },
    onDragEnter: () => {
      if (!canDrag) return;
      if (dragFeedUrl && dragFeedUrl !== feed.url) {
        setDragOverFeedUrl(feed.url);
        if (dragLastTargetRef.current !== feed.url) {
          dispatch(reorderFeeds({ fromUrl: dragFeedUrl, toUrl: feed.url }));
          dragCommittedRef.current = true;
          dragLastTargetRef.current = feed.url;
        }
      }
    },
    onDragOver: (e: DragEvent<HTMLDivElement>) => {
      if (!canDrag) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragFeedUrl && dragFeedUrl !== feed.url && dragOverFeedUrl !== feed.url) {
        setDragOverFeedUrl(feed.url);
        if (dragLastTargetRef.current !== feed.url) {
          dispatch(reorderFeeds({ fromUrl: dragFeedUrl, toUrl: feed.url }));
          dragCommittedRef.current = true;
          dragLastTargetRef.current = feed.url;
        }
      }
    },
    onDrop: (e: DragEvent<HTMLDivElement>) => {
      if (!canDrag) return;
      e.preventDefault();
      e.stopPropagation();
      dragCommittedRef.current = true;
      dragLastTargetRef.current = feed.url;
      setDragFeedUrl(null);
      setDragOverFeedUrl(null);
    }
  });

  return (
    <Box className="container" sx={{ pt: 1, pb: 0.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
        <Typography variant="overline" sx={{ color: 'var(--text-muted)', letterSpacing: '0.14em', fontWeight: 800 }}>
          {l.previewTitle}
        </Typography>
        <Chip
          size="small"
          label={connected ? l.live : `${l.disconnected} (${status})`}
          color={connected ? 'success' : 'default'}
          variant={connected ? 'filled' : 'outlined'}
        />
      </Stack>

      <FeedColumnsGrid
        feeds={renderedFeeds}
        view={columnViewModel}
        state={columnStateModel}
        handlers={columnHandlers}
        onGridDragOver={onGridDragOver}
        onGridDrop={onGridDrop}
        buildDragState={buildDragState}
      />
      <Snackbar
        open={clipboardNoticeOpen}
        autoHideDuration={1400}
        onClose={() => setClipboardNoticeOpen(false)}
        message={clipboardNotice || l.linkCopied}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
