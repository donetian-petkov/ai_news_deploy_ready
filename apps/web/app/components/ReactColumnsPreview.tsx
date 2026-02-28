'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, Snackbar, Stack, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  removeFeedLocally,
  hydrateFeedUiState,
  reorderFeeds,
  setAllFeedControlsOpen,
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
import { FeedColumn } from './columns/FeedColumn';
import type { BodyMode, CardLabels, FeedFilterPreset, SchemeValue, VibeValue } from './columns/reactColumns.types';
import { buildColumnPalette, cutoffFromAge, getVibeIcons, presetToFeedFilters, SCHEME_LIST, VIBE_LIST } from './columns/reactColumns.utils';

type Props = {
  wsUrl: string;
};

export default function ReactColumnsPreview({ wsUrl }: Props) {
  const dispatch = useAppDispatch();
  const connected = useAppSelector(s => s.connection.connected);
  const status = useAppSelector(s => s.connection.status);
  const language = useAppSelector(s => s.ui.language);
  const vibe = useAppSelector(s => s.ui.vibe);
  const scheme = useAppSelector(s => s.ui.scheme);
  const buttonMode = useAppSelector(s => s.ui.buttonMode);
  const performanceMode = useAppSelector(s => s.ui.performanceMode);
  const fontSize = useAppSelector(s => s.ui.fontSize);
  const notifyEnabled = useAppSelector(s => s.ui.notifyEnabled);
  const notifyMode = useAppSelector(s => s.ui.notifyMode);
  const hideAllResearch = useAppSelector(s => s.ui.hideAllResearch);
  const hideAllSummaries = useAppSelector(s => s.ui.hideAllSummaries);
  const showMoreNewsAllSeq = useAppSelector(s => s.ui.showMoreNewsAllSeq);
  const resetNewsShownAllSeq = useAppSelector(s => s.ui.resetNewsShownAllSeq);
  const aiEnabled = useAppSelector(s => s.ui.aiEnabled);
  const aiAvailable = useAppSelector(s => s.ui.aiAvailable);
  const feeds = useAppSelector(s => s.feeds.feeds);
  const pinnedByUrl = useAppSelector(s => s.feeds.pinnedByUrl);
  const controlsOpenByUrl = useAppSelector(s => s.feeds.controlsOpenByUrl);
  const deleteAgeByUrl = useAppSelector(s => s.feeds.deleteAgeByUrl);
  const orderByUrl = useAppSelector(s => s.feeds.orderByUrl);
  const searchQuery = useAppSelector(s => s.ui.searchQuery);
  const moodFilter = useAppSelector(s => s.ui.moodFilter);
  const typeFilter = useAppSelector(s => s.ui.typeFilter);
  const allColumnControlsHidden = useAppSelector(s => s.ui.allColumnControlsHidden);
  const itemsByFeed = useAppSelector(s => s.news.itemsByFeed);
  const summaryPendingById = useAppSelector(s => s.news.summaryPendingById);
  const researchPendingById = useAppSelector(s => s.news.researchPendingById);
  const pinnedNewsById = useAppSelector(s => s.news.pinnedNewsById);
  const askByItem = useAppSelector(s => s.news.askByItem);
  const pendingTimeoutsRef = useRef<Record<string, number>>({});
  const researchTimeoutsRef = useRef<Record<string, number>>({});
  const hydratedFeedUiRef = useRef(false);
  const seenNewsIdsRef = useRef<Set<string>>(new Set());
  const notificationsPrimedRef = useRef(false);
  const [bodyModes, setBodyModes] = useState<Record<string, BodyMode>>({});
  const [clipboardNoticeOpen, setClipboardNoticeOpen] = useState(false);
  const [clipboardNotice, setClipboardNotice] = useState('');
  const [dragFeedUrl, setDragFeedUrl] = useState<string | null>(null);
  const [dragOverFeedUrl, setDragOverFeedUrl] = useState<string | null>(null);
  const [advancedControlsByUrl, setAdvancedControlsByUrl] = useState<Record<string, boolean>>({});
  const dragCommittedRef = useRef(false);
  const dragLastTargetRef = useRef<string | null>(null);
  const [visibleByFeed, setVisibleByFeed] = useState<Record<string, number>>({});
  const [hydratedColumns, setHydratedColumns] = useState<Record<string, true>>({});
  const columnNodesRef = useRef<Record<string, HTMLDivElement | null>>({});
  const prevAllControlsHiddenRef = useRef<boolean | null>(null);
  const bg = language === 'bg';
  const l = useMemo(() => ({
    previewTitle: bg ? 'Колони На Живо' : 'Live Columns',
    live: bg ? 'На живо през WebSocket' : 'Live via WebSocket',
    disconnected: bg ? 'Разкачен' : 'Disconnected',
    waiting: bg ? 'Изчакване на новини...' : 'Waiting for news...',
    waitingMatches: bg ? 'Няма съвпадения засега...' : 'No matched news yet...',
    noMatches: bg ? 'Няма съвпадения за търсенето в този поток.' : 'No search matches in this stream.',
    pinned: bg ? 'Закачена' : 'Pinned',
    pin: bg ? 'Закачи' : 'Pin',
    remove: bg ? 'Премахни' : 'Remove',
    hideControls: bg ? 'Скрий контроли' : 'Hide controls',
    showControls: bg ? 'Покажи контроли' : 'Show controls',
    summariesOn: bg ? 'Резюмета: ВКЛ' : 'Summaries: ON',
    summariesOff: bg ? 'Резюмета: ИЗКЛ' : 'Summaries: OFF',
    researchOn: bg ? 'Авто проучване: ВКЛ' : 'Auto Research: ON',
    researchOff: bg ? 'Авто проучване: ИЗКЛ' : 'Auto Research: OFF',
    budgetLow: bg ? 'Бюджет: Нисък' : 'Budget: Low',
    budgetStandard: bg ? 'Бюджет: Стандарт' : 'Budget: Standard',
    budgetHigh: bg ? 'Бюджет: Висок' : 'Budget: High',
    poll45: bg ? 'Проверка: 45с' : 'Poll: 45s',
    poll60: bg ? 'Проверка: 60с' : 'Poll: 60s',
    poll90: bg ? 'Проверка: 90с' : 'Poll: 90s',
    poll120: bg ? 'Проверка: 120с' : 'Poll: 120s',
    poll180: bg ? 'Проверка: 180с' : 'Poll: 180s',
    poll300: bg ? 'Проверка: 300с' : 'Poll: 300s',
    sortNewest: bg ? 'Сортиране: Най-нови' : 'Sort: Newest',
    sortOldest: bg ? 'Сортиране: Най-стари' : 'Sort: Oldest',
    sortMatched: bg ? 'Сортиране: Съвпадения' : 'Sort: Matched',
    filterAll: bg ? 'Филтър: Всички' : 'Filter: All',
    filterMatches: bg ? 'Филтър: Само съвпадения' : 'Filter: Matches',
    filterResearched: bg ? 'Филтър: Само проучени' : 'Filter: Researched',
    filterSummaries: bg ? 'Филтър: Само резюмета' : 'Filter: Summaries',
    filterMatchesResearched: bg ? 'Филтър: Съвпадения + проучени' : 'Filter: Matches + Researched',
    filterMatchesSummaries: bg ? 'Филтър: Съвпадения + резюмета' : 'Filter: Matches + Summaries',
    filterResearchedSummaries: bg ? 'Филтър: Проучени + резюмета' : 'Filter: Researched + Summaries',
    filterAllFlags: bg ? 'Филтър: Всички флагове' : 'Filter: All flags',
    moreOptions: bg ? 'Още опции' : 'More options',
    lessOptions: bg ? 'По-малко опции' : 'Less options',
    matches: bg ? 'Съвпадения' : 'Matches',
    researched: bg ? 'Проучени' : 'Researched',
    summaries: bg ? 'Резюмета' : 'Summaries',
    match: bg ? 'СЪВПАДЕНИЕ' : 'MATCH',
    shareLink: bg ? 'Сподели линк' : 'Share Link',
    copyNews: bg ? 'Копирай новината' : 'Copy News',
    hideNews: bg ? 'Скрий новина' : 'Hide News',
    generatingSummary: bg ? 'Генериране на резюме...' : 'Generating Summary...',
    summary: bg ? 'Резюме' : 'Summary',
    researching: bg ? 'Проучване...' : 'Researching...',
    research: bg ? 'Проучване' : 'Research',
    askAgent: bg ? 'Питай агента' : 'Ask Agent',
    confidence: bg ? 'Увереност' : 'Confidence',
    showSummary: bg ? 'Покажи резюме' : 'Show Summary',
    hideSummary: bg ? 'Скрий резюме' : 'Hide Summary',
    aiUnavailable: bg ? 'AI изключен' : 'AI unavailable',
    showResearch: bg ? 'Покажи проучване' : 'Show Research',
    hideResearch: bg ? 'Скрий проучване' : 'Hide Research',
    showMore: bg ? 'Покажи още' : 'Show More',
    showLess: bg ? 'Покажи по-малко' : 'Show Less',
    showFiveMore: bg ? 'Покажи още 5' : 'Show 5 more',
    resetToTenItems: bg ? 'Нулирай до 10' : 'Reset to 10',
    autoResearching: bg ? 'Авто проучване...' : 'Auto researching...',
    pinNews: bg ? 'Закачи новина' : 'Pin news',
    unpinNews: bg ? 'Откачи новина' : 'Unpin news',
    questionsLeft: bg ? 'Оставащи въпроси' : 'Questions left',
    askPlaceholder: bg ? 'Питай за тази конкретна новина...' : 'Ask about this specific news...',
    thinking: bg ? 'Мисля...' : 'Thinking...',
    send: bg ? 'Изпрати' : 'Send',
    linkCopied: bg ? 'Линкът е копиран' : 'Link copied',
    newsCopied: bg ? 'Новината е копирана' : 'News copied',
    deleteYesterday: bg ? 'Изтрий: Вчера' : 'Delete: Yesterday',
    deleteWeek: bg ? 'Изтрий: Седмица' : 'Delete: Past week',
    deleteMonth: bg ? 'Изтрий: Месец' : 'Delete: Past month',
    deleteYear: bg ? 'Изтрий: Година' : 'Delete: Past year',
    deleteOld: bg ? 'Изтрий стари' : 'Delete old'
  }), [bg]);

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

  useEffect(() => {
    if (typeof window === 'undefined' || hydratedFeedUiRef.current || !feeds.length) return;
    try {
      const raw = window.localStorage.getItem('aiNews.feedUi.v1');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          pinnedByUrl?: Record<string, boolean>;
          controlsOpenByUrl?: Record<string, boolean>;
          deleteAgeByUrl?: Record<string, 'yesterday' | 'week' | 'month' | 'year'>;
          orderByUrl?: string[];
        };
        dispatch(hydrateFeedUiState(parsed));
      }
    } catch {}
    hydratedFeedUiRef.current = true;
  }, [dispatch, feeds.length]);

  useEffect(() => {
    if (typeof window === 'undefined' || !feeds.length) return;
    try {
      window.localStorage.setItem('aiNews.feedUi.v1', JSON.stringify({
        pinnedByUrl,
        controlsOpenByUrl,
        deleteAgeByUrl,
        orderByUrl
      }));
    } catch {}
  }, [controlsOpenByUrl, deleteAgeByUrl, feeds.length, orderByUrl, pinnedByUrl]);

  useEffect(() => {
    if (!feeds.length) return;
    const feedUrlSet = new Set(feeds.map(f => f.url));
    setAdvancedControlsByUrl(prev => {
      let changed = false;
      const next: Record<string, boolean> = {};
      for (const [url, value] of Object.entries(prev)) {
        if (feedUrlSet.has(url)) next[url] = !!value;
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [feeds]);

  useEffect(() => {
    if (!notificationsPrimedRef.current) {
      Object.values(itemsByFeed).forEach(items => {
        (items || []).forEach(item => {
          if (item?.id) seenNewsIdsRef.current.add(item.id);
        });
      });
      notificationsPrimedRef.current = true;
      return;
    }

    const newlySeen: Array<{ feedUrl: string; item: NewsItem }> = [];
    Object.entries(itemsByFeed).forEach(([feedUrl, items]) => {
      const list = Array.isArray(items) ? items : [];
      // Lists are kept newest-first; stop scanning once we hit first known id.
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item?.id) continue;
        if (seenNewsIdsRef.current.has(item.id)) break;
        newlySeen.push({ feedUrl, item });
      }
    });

    if (!newlySeen.length) return;

    const notificationsAllowed = notifyEnabled
      && typeof Notification !== 'undefined'
      && Notification.permission === 'granted';

    const shouldNotify = (feedUrl: string, it: NewsItem): boolean => {
      if (notifyMode === 'all') return true;
      if (notifyMode === 'pinned') return !!pinnedByUrl[feedUrl];
      if (notifyMode === 'matched_pinned') return !!it.isMatch && !!pinnedByUrl[feedUrl];
      return !!it.isMatch;
    };

    // Notify in chronological order when multiple items land in one batch.
    for (let i = newlySeen.length - 1; i >= 0; i--) {
      const { feedUrl, item } = newlySeen[i];
      seenNewsIdsRef.current.add(item.id);
      if (!notificationsAllowed) continue;
      if (!shouldNotify(feedUrl, item)) continue;
      const body = String(item.summary || item.research || '').trim();
      const n = new Notification(item.isMatch ? `MATCH · ${item.title}` : item.title, {
        body: body || item.link
      });
      n.onclick = () => window.open(item.link, '_blank', 'noopener,noreferrer');
    }
  }, [itemsByFeed, notifyEnabled, notifyMode, pinnedByUrl]);

  useEffect(() => {
    if (!feeds.length) return;
    if (prevAllControlsHiddenRef.current === null) {
      prevAllControlsHiddenRef.current = allColumnControlsHidden;
      if (allColumnControlsHidden) {
        dispatch(setAllFeedControlsOpen(false));
      }
      return;
    }

    if (prevAllControlsHiddenRef.current !== allColumnControlsHidden) {
      dispatch(setAllFeedControlsOpen(!allColumnControlsHidden));
      prevAllControlsHiddenRef.current = allColumnControlsHidden;
      return;
    }

    if (allColumnControlsHidden) {
      dispatch(setAllFeedControlsOpen(false));
    }
  }, [allColumnControlsHidden, dispatch, feeds.length]);

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

  useEffect(() => {
    if (!renderedFeeds.length) return;
    setVisibleByFeed(prev => {
      const next: Record<string, number> = {};
      renderedFeeds.forEach(feed => {
        next[feed.url] = Math.max(10, prev[feed.url] || 10);
      });
      return next;
    });
  }, [renderedFeeds]);

  useEffect(() => {
    if (showMoreNewsAllSeq <= 0 || !renderedFeeds.length) return;
    setVisibleByFeed(prev => {
      const next = { ...prev };
      renderedFeeds.forEach(feed => {
        next[feed.url] = Math.max(10, (next[feed.url] || 10) + 5);
      });
      return next;
    });
  }, [showMoreNewsAllSeq, renderedFeeds]);

  useEffect(() => {
    if (resetNewsShownAllSeq <= 0 || !renderedFeeds.length) return;
    setVisibleByFeed(prev => {
      const next = { ...prev };
      renderedFeeds.forEach(feed => {
        next[feed.url] = 10;
      });
      return next;
    });
  }, [resetNewsShownAllSeq, renderedFeeds]);

  useEffect(() => {
    setHydratedColumns(prev => {
      const next = { ...prev };
      let changed = false;
      for (let i = 0; i < Math.min(4, renderedFeeds.length); i++) {
        const url = renderedFeeds[i].url;
        if (!next[url]) {
          next[url] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [renderedFeeds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      const found: string[] = [];
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const url = String(el.dataset.feedUrl || '');
        if (url) found.push(url);
      });
      if (!found.length) return;
      setHydratedColumns(prev => {
        const next = { ...prev };
        let changed = false;
        found.forEach(url => {
          if (!next[url]) {
            next[url] = true;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, {
      root: null,
      rootMargin: '320px 0px',
      threshold: 0.01
    });

    renderedFeeds.forEach(feed => {
      const node = columnNodesRef.current[feed.url];
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [renderedFeeds]);

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
    if (title) chunks.push(`Title: ${title}`);
    if (summary) chunks.push(`Summary: ${summary}`);
    if (research) chunks.push(`Research: ${research}`);
    if (link) chunks.push(`Link: ${link}`);
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

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(320px, 1fr))',
            lg: 'repeat(3, minmax(330px, 1fr))',
            xl: 'repeat(4, minmax(330px, 1fr))'
          }
        }}
        onDragOver={e => {
          if (!dragFeedUrl) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={e => {
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
        }}
      >
        {renderedFeeds.map((feed: FeedInfo, columnIdx: number) => {
          const isMatchColumn = feed.url === FILTERED_FEED_URL || String(feed.label || '').toLowerCase().startsWith('filtered');
          const canDrag = !isMatchColumn;

          return (
            <FeedColumn
              key={feed.url}
              feed={feed}
              columnIdx={columnIdx}
              palette={palette}
              performanceMode={performanceMode}
              moodFilter={moodFilter}
              typeFilter={typeFilter}
              searchQuery={searchQuery}
              hideAllResearch={hideAllResearch}
              hideAllSummaries={hideAllSummaries}
              aiEnabled={aiEnabled}
              aiAvailable={aiAvailable}
              buttonMode={buttonMode}
              fontScale={fontScale}
              connected={connected}
              compactBtnSx={compactBtnSx}
              compactFormSx={compactFormSx}
              labels={l}
              cardLabels={cardLabels}
              vibeIcons={vibeIcons}
              filteredColumnItems={filteredColumnItems}
              itemsByFeed={itemsByFeed}
              visibleLimit={Math.max(10, visibleByFeed[feed.url] || 10)}
              isHydrated={!!hydratedColumns[feed.url]}
              pinned={!!pinnedByUrl[feed.url]}
              controlsOpen={typeof controlsOpenByUrl[feed.url] === 'boolean' ? !!controlsOpenByUrl[feed.url] : true}
              advancedControlsOpen={!!advancedControlsByUrl[feed.url]}
              deleteAge={deleteAgeByUrl[feed.url] || 'week'}
              summaryPendingById={summaryPendingById}
              researchPendingById={researchPendingById}
              pinnedNewsById={pinnedNewsById}
              askByItem={askByItem}
              bodyModes={bodyModes}
              getBodyMode={getBodyMode}
              getDefaultBodyMode={getDefaultBodyMode}
              setBodyMode={setBodyMode}
              drag={{
                canDrag,
                isDragging: dragFeedUrl === feed.url,
                isDropTarget: !!dragFeedUrl && dragFeedUrl !== feed.url && dragOverFeedUrl === feed.url,
                onDragStart: e => {
                  if (!canDrag) return;
                  const target = e.target as HTMLElement | null;
                  if (target?.closest('button, a, input, textarea, select, label, [role="button"]')) {
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
                setNode: node => {
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
                onDragOver: e => {
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
                onDrop: e => {
                  if (!canDrag) return;
                  e.preventDefault();
                  e.stopPropagation();
                  dragCommittedRef.current = true;
                  dragLastTargetRef.current = feed.url;
                  setDragFeedUrl(null);
                  setDragOverFeedUrl(null);
                }
              }}
              onTogglePinnedColumn={feedUrl => dispatch(togglePinned(feedUrl))}
              onRemoveFeed={removeFeed}
              onToggleFeedControls={feedUrl => dispatch(toggleFeedControls(feedUrl))}
              onToggleFeedSummary={toggleFeedSummary}
              onToggleFeedResearch={toggleFeedResearch}
              onSetFeedBudget={setFeedBudget}
              onSetFeedInterval={setFeedInterval}
              onSetFeedSortMode={setFeedSortMode}
              onSetFeedFilterPreset={setFeedFilterPreset}
              onToggleAdvancedControls={feedUrl => setAdvancedControlsByUrl(prev => ({ ...prev, [feedUrl]: !prev[feedUrl] }))}
              onSetDeleteAge={(feedUrl, age) => dispatch(setFeedDeleteAge({ feedUrl, age }))}
              onRemoveOldInFeed={removeOldInFeed}
              onShowMoreNews={feedUrl => setVisibleByFeed(prev => ({ ...prev, [feedUrl]: (prev[feedUrl] || 10) + 5 }))}
              onResetNewsToTen={feedUrl => setVisibleByFeed(prev => ({ ...prev, [feedUrl]: 10 }))}
              onTogglePinnedNews={id => dispatch(togglePinnedNews(id))}
              onCopyLink={copyLink}
              onCopyNewsPayload={copyNewsPayload}
              onHideItem={hideItem}
              onRequestSummary={requestSummary}
              onRequestResearch={requestResearch}
              onToggleAsk={(id, feedUrl) => dispatch(toggleAskOpen({ id, feedUrl }))}
              onSetAskDraft={(id, feedUrl, draft) => dispatch(setAskDraft({ id, feedUrl, draft }))}
              onAskSubmit={requestAsk}
            />
          );
        })}
      </Box>
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
