'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Link as MuiLink,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { MAX_COLUMNS } from '../store/constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  removeFeedLocally,
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
  setResearchPending,
  setSummaryPending
} from '../store/slices/newsSlice';
import { sendWsMessage, startWsConnection, stopWsConnection } from '../store/wsClient';
import type { BudgetMode, FeedInfo, NewsItem, SortMode } from '../store/types';

type Props = {
  wsUrl: string;
};

type BodyMode = 'collapsed' | 'expanded' | 'hidden';

function formatTime(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  try {
    return new Date(ms).toLocaleString('bg-BG', { hour12: false });
  } catch {
    return '';
  }
}

function extractConfidence(research: string): string {
  const m = String(research || '').match(/confidence\s*:\s*(low|medium|high)/i);
  if (!m) return '';
  const level = String(m[1] || '').toLowerCase();
  if (level === 'high') return 'High';
  if (level === 'medium') return 'Medium';
  if (level === 'low') return 'Low';
  return '';
}

function compactResearch(research: string): string {
  const normalized = String(research || '').replace(/\s+/g, ' ').trim();
  return normalized.length > 340 ? `${normalized.slice(0, 340)}...` : normalized;
}

function collapseText(text: string, maxChars: number): string {
  const normalized = String(text || '').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}...`;
}

function cutoffFromAge(age: 'yesterday' | 'week' | 'month' | 'year'): number {
  const now = Date.now();
  if (age === 'yesterday') return now - 24 * 60 * 60 * 1000;
  if (age === 'month') return now - 30 * 24 * 60 * 60 * 1000;
  if (age === 'year') return now - 365 * 24 * 60 * 60 * 1000;
  return now - 7 * 24 * 60 * 60 * 1000;
}

export default function ReactColumnsPreview({ wsUrl }: Props) {
  const dispatch = useAppDispatch();
  const connected = useAppSelector(s => s.connection.connected);
  const status = useAppSelector(s => s.connection.status);
  const language = useAppSelector(s => s.ui.language);
  const feeds = useAppSelector(s => s.feeds.feeds);
  const pinnedByUrl = useAppSelector(s => s.feeds.pinnedByUrl);
  const controlsOpenByUrl = useAppSelector(s => s.feeds.controlsOpenByUrl);
  const deleteAgeByUrl = useAppSelector(s => s.feeds.deleteAgeByUrl);
  const searchQuery = useAppSelector(s => s.ui.searchQuery);
  const itemsByFeed = useAppSelector(s => s.news.itemsByFeed);
  const summaryPendingById = useAppSelector(s => s.news.summaryPendingById);
  const researchPendingById = useAppSelector(s => s.news.researchPendingById);
  const askByItem = useAppSelector(s => s.news.askByItem);
  const pendingTimeoutsRef = useRef<Record<string, number>>({});
  const researchTimeoutsRef = useRef<Record<string, number>>({});
  const [hideAllResearch, setHideAllResearch] = useState(false);
  const [bodyModes, setBodyModes] = useState<Record<string, BodyMode>>({});
  const [shareNoticeOpen, setShareNoticeOpen] = useState(false);
  const bg = language === 'bg';
  const l = useMemo(() => ({
    previewTitle: bg ? 'React Визуализация (Преглед)' : 'React Renderer Preview',
    live: bg ? 'На живо през WebSocket' : 'Live via WebSocket',
    disconnected: bg ? 'Разкачен' : 'Disconnected',
    waiting: bg ? 'Изчакване на новини...' : 'Waiting for news...',
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
    matches: bg ? 'Съвпадения' : 'Matches',
    researched: bg ? 'Проучени' : 'Researched',
    summaries: bg ? 'Резюмета' : 'Summaries',
    match: bg ? 'СЪВПАДЕНИЕ' : 'MATCH',
    shareLink: bg ? 'Сподели линк' : 'Share Link',
    hideNews: bg ? 'Скрий новина' : 'Hide News',
    generatingSummary: bg ? 'Генериране на резюме...' : 'Generating Summary...',
    summary: bg ? 'Резюме' : 'Summary',
    researching: bg ? 'Проучване...' : 'Researching...',
    research: bg ? 'Проучване' : 'Research',
    askAgent: bg ? 'Питай агента' : 'Ask Agent',
    confidence: bg ? 'Увереност' : 'Confidence',
    showSummary: bg ? 'Покажи резюме' : 'Show Summary',
    hideSummary: bg ? 'Скрий резюме' : 'Hide Summary',
    showResearch: bg ? 'Покажи проучване' : 'Show Research',
    hideResearch: bg ? 'Скрий проучване' : 'Hide Research',
    showMore: bg ? 'Покажи още' : 'Show More',
    showLess: bg ? 'Покажи по-малко' : 'Show Less',
    questionsLeft: bg ? 'Оставащи въпроси' : 'Questions left',
    askPlaceholder: bg ? 'Питай за тази конкретна новина...' : 'Ask about this specific news...',
    thinking: bg ? 'Мисля...' : 'Thinking...',
    send: bg ? 'Изпрати' : 'Send',
    linkCopied: bg ? 'Линкът е копиран' : 'Link copied',
    deleteYesterday: bg ? 'Изтрий: Вчера' : 'Delete: Yesterday',
    deleteWeek: bg ? 'Изтрий: Седмица' : 'Delete: Past week',
    deleteMonth: bg ? 'Изтрий: Месец' : 'Delete: Past month',
    deleteYear: bg ? 'Изтрий: Година' : 'Delete: Past year',
    deleteOld: bg ? 'Изтрий стари' : 'Delete old'
  }), [bg]);

  useEffect(() => {
    startWsConnection(dispatch, wsUrl);

    return () => {
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
    const onToggleAllColumnControls = () => {
      const urls = feeds.map(f => f.url);
      if (!urls.length) return;
      const allOpen = urls.every(url => controlsOpenByUrl[url] !== false);
      dispatch(setAllFeedControlsOpen(!allOpen));
    };
    const onHideAllResearch = () => {
      setHideAllResearch(true);
    };
    const onSetVibe = () => {
      // keep React preview in sync with top controls interactions
    };
    window.addEventListener('ai-news:toggle-all-column-controls', onToggleAllColumnControls);
    window.addEventListener('ai-news:hide-all-research', onHideAllResearch);
    window.addEventListener('ai-news:set-vibe', onSetVibe);
    return () => {
      window.removeEventListener('ai-news:toggle-all-column-controls', onToggleAllColumnControls);
      window.removeEventListener('ai-news:hide-all-research', onHideAllResearch);
      window.removeEventListener('ai-news:set-vibe', onSetVibe);
    };
  }, [dispatch, feeds, controlsOpenByUrl]);

  const previewFeeds = useMemo(() => {
    if (feeds.length) {
      const list = [...feeds];
      list.sort((a, b) => {
        const aPinned = !!pinnedByUrl[a.url];
        const bPinned = !!pinnedByUrl[b.url];
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        return 0;
      });
      return list.slice(0, MAX_COLUMNS);
    }
    const fallback = Object.keys(itemsByFeed).slice(0, MAX_COLUMNS).map(url => ({
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
  }, [feeds, itemsByFeed, pinnedByUrl]);

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
  const bodyKey = (it: NewsItem, kind: 'summary' | 'research') => `${it.feedUrl}::${it.id}::${kind}`;

  const getBodyMode = (key: string, text: string, threshold: number): BodyMode => {
    const saved = bodyModes[key];
    if (saved) return saved;
    return String(text || '').trim().length > threshold ? 'collapsed' : 'expanded';
  };

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
      setShareNoticeOpen(true);
    } catch {
      window.open(value, '_blank', 'noopener,noreferrer');
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

  const toggleFeedFilter = (feed: FeedInfo, key: keyof FeedInfo['filters']) => {
    if (!connected) return;
    const nextFilters = {
      ...feed.filters,
      [key]: !feed.filters[key]
    };
    const ok = sendWsMessage({
      type: 'set_feed_column_settings',
      feedUrl: feed.url,
      sortMode: feed.sortMode,
      filters: nextFilters
    });
    if (ok) dispatch(setFeedColumnSettings({ feedUrl: feed.url, filters: nextFilters }));
  };

  const removeOldInFeed = (feed: FeedInfo) => {
    const age = deleteAgeByUrl[feed.url] || 'week';
    dispatch(removeOldItemsInFeed({
      feedUrl: feed.url,
      cutoffMs: cutoffFromAge(age)
    }));
  };

  return (
    <Box className="container" sx={{ pt: 1, pb: 0.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
        <Typography variant="overline" sx={{ color: 'rgba(235,240,255,0.8)', letterSpacing: '0.14em', fontWeight: 800 }}>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
        }}
      >
        {previewFeeds.map((feed: FeedInfo) => {
          const items = itemsByFeed[feed.url] || [];
          const normalizedQuery = String(searchQuery || '').trim().toLowerCase();
          const itemsVisible = normalizedQuery
            ? items.filter(it => {
              const hay = `${it.title}\n${it.summary || ''}\n${it.research || ''}`.toLowerCase();
              return hay.includes(normalizedQuery);
            })
            : items;
          const pinned = !!pinnedByUrl[feed.url];
          const controlsOpen = typeof controlsOpenByUrl[feed.url] === 'boolean' ? !!controlsOpenByUrl[feed.url] : true;
          return (
            <Card key={feed.url} variant="outlined" sx={{ background: 'rgba(15, 22, 38, 0.8)', borderColor: 'rgba(97, 123, 161, 0.42)' }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                  <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, pr: 1 }}>
                    {feed.label}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={itemsVisible.length} />
                    <Chip size="small" variant="outlined" label={feed.kind} />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 1.1 }} flexWrap="wrap">
                  <Button
                    size="small"
                    variant={pinned ? 'contained' : 'outlined'}
                    startIcon={pinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                    onClick={() => dispatch(togglePinned(feed.url))}
                  >
                    {pinned ? l.pinned : l.pin}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => removeFeed(feed.url)}
                    disabled={!connected}
                  >
                    {l.remove}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<TuneIcon />}
                    onClick={() => dispatch(toggleFeedControls(feed.url))}
                  >
                    {controlsOpen ? l.hideControls : l.showControls}
                  </Button>
                </Stack>
                {controlsOpen ? (
                  <Stack direction="row" spacing={1} sx={{ mb: 1.1 }} flexWrap="wrap" alignItems="center">
                    <Button
                      size="small"
                      variant={feed.summaryEnabled ? 'contained' : 'outlined'}
                      onClick={() => toggleFeedSummary(feed)}
                      disabled={!connected}
                    >
                      {feed.summaryEnabled ? l.summariesOn : l.summariesOff}
                    </Button>
                    <Button
                      size="small"
                      variant={feed.researchEnabled ? 'contained' : 'outlined'}
                      onClick={() => toggleFeedResearch(feed)}
                      disabled={!connected}
                    >
                      {feed.researchEnabled ? l.researchOn : l.researchOff}
                    </Button>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={feed.budget}
                        onChange={e => setFeedBudget(feed, e.target.value as BudgetMode)}
                        disabled={!connected}
                      >
                        <MenuItem value="low">{l.budgetLow}</MenuItem>
                        <MenuItem value="standard">{l.budgetStandard}</MenuItem>
                        <MenuItem value="high">{l.budgetHigh}</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <Select
                        value={String(feed.intervalSec || 120)}
                        onChange={e => setFeedInterval(feed, Number(e.target.value) || 120)}
                        disabled={!connected}
                      >
                        <MenuItem value="45">{l.poll45}</MenuItem>
                        <MenuItem value="60">{l.poll60}</MenuItem>
                        <MenuItem value="90">{l.poll90}</MenuItem>
                        <MenuItem value="120">{l.poll120}</MenuItem>
                        <MenuItem value="180">{l.poll180}</MenuItem>
                        <MenuItem value="300">{l.poll300}</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 132 }}>
                      <Select
                        value={feed.sortMode}
                        onChange={e => setFeedSortMode(feed, e.target.value as SortMode)}
                        disabled={!connected}
                      >
                        <MenuItem value="newest">{l.sortNewest}</MenuItem>
                        <MenuItem value="oldest">{l.sortOldest}</MenuItem>
                        <MenuItem value="matched">{l.sortMatched}</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={feed.filters.onlyMatches}
                          onChange={() => toggleFeedFilter(feed, 'onlyMatches')}
                          disabled={!connected}
                        />
                      }
                      label={l.matches}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={feed.filters.onlyResearched}
                          onChange={() => toggleFeedFilter(feed, 'onlyResearched')}
                          disabled={!connected}
                        />
                      }
                      label={l.researched}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={feed.filters.onlySummaries}
                          onChange={() => toggleFeedFilter(feed, 'onlySummaries')}
                          disabled={!connected}
                        />
                      }
                      label={l.summaries}
                    />
                    <FormControl size="small" sx={{ minWidth: 148 }}>
                      <Select
                        value={deleteAgeByUrl[feed.url] || 'week'}
                        onChange={e => dispatch(setFeedDeleteAge({
                          feedUrl: feed.url,
                          age: e.target.value as 'yesterday' | 'week' | 'month' | 'year'
                        }))}
                      >
                        <MenuItem value="yesterday">{l.deleteYesterday}</MenuItem>
                        <MenuItem value="week">{l.deleteWeek}</MenuItem>
                        <MenuItem value="month">{l.deleteMonth}</MenuItem>
                        <MenuItem value="year">{l.deleteYear}</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => removeOldInFeed(feed)}
                    >
                      {l.deleteOld}
                    </Button>
                  </Stack>
                ) : null}

                <Stack spacing={1.2}>
                  {itemsVisible.length === 0 ? (
                    <Alert severity="info" variant="outlined">
                      {items.length === 0 ? l.waiting : l.noMatches}
                    </Alert>
                  ) : itemsVisible.map(it => (
                    <Card
                      key={it.id}
                      variant="outlined"
                      sx={{
                        background: 'rgba(5, 11, 24, 0.72)',
                        borderColor: it.isMatch ? 'rgba(255, 198, 84, 0.68)' : 'rgba(100, 128, 170, 0.35)'
                      }}
                    >
                      <CardContent sx={{ pb: '12px !important' }}>
                        {(() => {
                          const key = askKey(it);
                          const askState = askByItem[key] || {
                            open: false,
                            draft: '',
                            pending: false,
                            used: 0,
                            remaining: 5,
                            messages: []
                          };
                          return (
                            <>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(210,219,235,0.74)' }}>
                            {formatTime(it.publishedMs)}
                          </Typography>
                          <Stack direction="row" spacing={0.6} alignItems="center">
                            {it.isMatch ? <Chip size="small" label={l.match} color="warning" variant="outlined" /> : null}
                            <Tooltip title={l.shareLink}>
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{ minWidth: 34, px: 0.75 }}
                                onClick={() => copyLink(it.link)}
                              >
                                <ContentCopyIcon sx={{ fontSize: 15 }} />
                              </Button>
                            </Tooltip>
                            <Tooltip title={l.hideNews}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                sx={{ minWidth: 34, px: 0.75 }}
                                onClick={() => hideItem(it)}
                                disabled={!connected}
                              >
                                <VisibilityOffIcon sx={{ fontSize: 15 }} />
                              </Button>
                            </Tooltip>
                          </Stack>
                        </Stack>

                        <MuiLink
                          href={it.link}
                          target="_blank"
                          rel="noreferrer"
                          underline="hover"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            fontSize: '1.03rem',
                            lineHeight: 1.32,
                            fontWeight: 800,
                            color: 'primary.light',
                            mb: 1
                          }}
                        >
                          <span>{it.title}</span>
                          <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </MuiLink>

                        {controlsOpen ? (
                          <Stack direction="row" spacing={1} sx={{ mb: it.summary ? 1 : 0 }} flexWrap="wrap">
                            <Button
                              size="small"
                              variant={summaryPendingById[it.id] ? 'contained' : 'outlined'}
                              startIcon={<AutoAwesomeIcon />}
                              onClick={() => requestSummary(it)}
                              disabled={!connected || !!summaryPendingById[it.id]}
                            >
                              {summaryPendingById[it.id] ? l.generatingSummary : l.summary}
                            </Button>
                            <Button
                              size="small"
                              variant={researchPendingById[it.id] ? 'contained' : 'outlined'}
                              startIcon={<ManageSearchIcon />}
                              onClick={() => requestResearch(it)}
                              disabled={!connected || !!researchPendingById[it.id]}
                            >
                              {researchPendingById[it.id] ? l.researching : l.research}
                            </Button>
                            <Button
                              size="small"
                              variant={askState.open ? 'contained' : 'outlined'}
                              startIcon={<SmartToyIcon />}
                              onClick={() => dispatch(toggleAskOpen({ id: it.id, feedUrl: it.feedUrl }))}
                              disabled={!connected}
                            >
                              {l.askAgent}
                            </Button>
                          </Stack>
                        ) : null}

                        {it.summary ? (() => {
                          const key = bodyKey(it, 'summary');
                          const mode = getBodyMode(key, it.summary, 260);
                          const visible = mode !== 'hidden';
                          const longText = String(it.summary).trim().length > 260;
                          const text = mode === 'collapsed' ? collapseText(it.summary, 260) : it.summary;
                          return (
                            <Box>
                              {visible ? (
                                <Typography variant="body2" sx={{ color: 'rgba(226,234,250,0.95)', whiteSpace: 'pre-wrap' }}>
                                  {text}
                                </Typography>
                              ) : null}
                              <Stack direction="row" spacing={1} sx={{ mt: 0.7 }} flexWrap="wrap">
                                {mode === 'hidden' ? (
                                  <Button size="small" variant="outlined" onClick={() => setBodyMode(key, longText ? 'collapsed' : 'expanded')}>
                                    {l.showSummary}
                                  </Button>
                                ) : (
                                  <Button size="small" variant="outlined" color="warning" onClick={() => setBodyMode(key, 'hidden')}>
                                    {l.hideSummary}
                                  </Button>
                                )}
                                {visible && longText ? (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setBodyMode(key, mode === 'collapsed' ? 'expanded' : 'collapsed')}
                                  >
                                    {mode === 'collapsed' ? l.showMore : l.showLess}
                                  </Button>
                                ) : null}
                              </Stack>
                            </Box>
                          );
                        })() : null}
                        {it.research && !hideAllResearch ? (() => {
                          const key = bodyKey(it, 'research');
                          const mode = getBodyMode(key, it.research, 340);
                          const visible = mode !== 'hidden';
                          const longText = String(it.research).trim().length > 340;
                          const text = mode === 'collapsed' ? compactResearch(it.research) : it.research;
                          return (
                            <Box sx={{ mt: 1 }}>
                              {extractConfidence(it.research) ? (
                                <Typography variant="caption" sx={{ color: 'rgba(212,220,236,0.75)', display: 'block', mb: 0.35 }}>
                                  {l.confidence}: {extractConfidence(it.research)}
                                </Typography>
                              ) : null}
                              {visible ? (
                                <Typography variant="body2" sx={{ color: 'rgba(205,218,238,0.92)', whiteSpace: 'pre-wrap' }}>
                                  {text}
                                </Typography>
                              ) : null}
                              <Stack direction="row" spacing={1} sx={{ mt: 0.7 }} flexWrap="wrap">
                                {mode === 'hidden' ? (
                                  <Button size="small" variant="outlined" onClick={() => setBodyMode(key, longText ? 'collapsed' : 'expanded')}>
                                    {l.showResearch}
                                  </Button>
                                ) : (
                                  <Button size="small" variant="outlined" color="warning" onClick={() => setBodyMode(key, 'hidden')}>
                                    {l.hideResearch}
                                  </Button>
                                )}
                                {visible && longText ? (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setBodyMode(key, mode === 'collapsed' ? 'expanded' : 'collapsed')}
                                  >
                                    {mode === 'collapsed' ? l.showMore : l.showLess}
                                  </Button>
                                ) : null}
                              </Stack>
                            </Box>
                          );
                        })() : null}
                        {askState.open ? (
                          <Box sx={{ mt: 1.1, p: 1, border: '1px solid rgba(106,128,162,0.4)', borderRadius: 1.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                              <Typography variant="caption" sx={{ color: 'rgba(210,219,235,0.74)' }}>
                                {l.askAgent}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(188,203,229,0.75)' }}>
                                {l.questionsLeft}: {askState.remaining}
                              </Typography>
                            </Stack>
                            <Stack spacing={0.8} sx={{ mb: 0.8, maxHeight: 180, overflow: 'auto' }}>
                              {askState.messages.map((m, idx) => (
                                <Box key={`${idx}-${m.q.slice(0, 18)}`}>
                                  <Typography variant="caption" sx={{ color: 'rgba(146,204,255,0.92)', display: 'block' }}>
                                    Q: {m.q}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: m.error ? 'rgba(255,168,168,0.95)' : 'rgba(216,227,246,0.92)', display: 'block' }}>
                                    A: {m.error || m.a || '...'}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder={l.askPlaceholder}
                                value={askState.draft}
                                onChange={e => dispatch(setAskDraft({ id: it.id, feedUrl: it.feedUrl, draft: e.target.value.slice(0, 400) }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    requestAsk(it);
                                  }
                                }}
                              />
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => requestAsk(it)}
                                disabled={!connected || askState.pending || askState.remaining <= 0 || !String(askState.draft || '').trim()}
                              >
                                {askState.pending ? l.thinking : l.send}
                              </Button>
                            </Stack>
                          </Box>
                        ) : null}
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>
      <Snackbar
        open={shareNoticeOpen}
        autoHideDuration={1400}
        onClose={() => setShareNoticeOpen(false)}
        message={l.linkCopied}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
