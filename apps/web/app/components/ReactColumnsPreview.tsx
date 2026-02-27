'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import TuneIcon from '@mui/icons-material/Tune';
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
  setResearchPending,
  setSummaryPending
} from '../store/slices/newsSlice';
import { sendWsMessage, startWsConnection, stopWsConnection } from '../store/wsClient';
import type { BudgetMode, FeedInfo, NewsItem, SortMode } from '../store/types';

type Props = {
  wsUrl: string;
};

type BodyMode = 'collapsed' | 'expanded' | 'hidden';
type VibeValue = 'default' | 'anime' | 'arcade' | 'cinema' | 'newspaper' | 'cyberwitch' | 'fantasy' | 'scifi';
type SchemeValue = 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest';

const VIBE_BASE_COLORS: Record<VibeValue, [string, string, string]> = {
  default: ['#3d95ff', '#20cb7d', '#ffac1a'],
  anime: ['#ff4da6', '#38bdf8', '#ffe15c'],
  arcade: ['#39ff14', '#ff40ff', '#ffdd00'],
  cinema: ['#d2a85f', '#b4253a', '#f4c870'],
  newspaper: ['#4e627a', '#78808c', '#b27418'],
  cyberwitch: ['#b34cff', '#00ddff', '#ff74e6'],
  fantasy: ['#56a86e', '#886a4a', '#d9b054'],
  scifi: ['#00c9ff', '#707cff', '#74ffcf']
};

const SCHEME_TUNING: Record<SchemeValue, { hueShift: number; satMul: number; lightMul: number; softAlpha: number }> = {
  classic: { hueShift: 0, satMul: 1.0, lightMul: 1.0, softAlpha: 0.26 },
  vivid: { hueShift: 10, satMul: 1.16, lightMul: 1.02, softAlpha: 0.30 },
  sunset: { hueShift: -22, satMul: 1.08, lightMul: 0.96, softAlpha: 0.29 },
  neon: { hueShift: 32, satMul: 1.28, lightMul: 1.04, softAlpha: 0.27 },
  ocean: { hueShift: -52, satMul: 1.03, lightMul: 0.94, softAlpha: 0.30 },
  forest: { hueShift: -105, satMul: 0.82, lightMul: 0.86, softAlpha: 0.28 }
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const s = String(hex || '').trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return { r: 127, g: 127, b: 127 };
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16)
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * (((bn - rn) / d) + 2);
    else h = 60 * (((rn - gn) / d) + 4);
  }

  if (h < 0) h += 360;
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hh >= 0 && hh < 1) { r1 = c; g1 = x; b1 = 0; }
  else if (hh < 2) { r1 = x; g1 = c; b1 = 0; }
  else if (hh < 3) { r1 = 0; g1 = c; b1 = x; }
  else if (hh < 4) { r1 = 0; g1 = x; b1 = c; }
  else if (hh < 5) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }

  const m = l - c / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

function transformHex(hex: string, tuning: { hueShift: number; satMul: number; lightMul: number }): { r: number; g: number; b: number } {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const h = ((hsl.h + tuning.hueShift) % 360 + 360) % 360;
  const s = clamp(hsl.s * tuning.satMul, 0.12, 1);
  const l = clamp(hsl.l * tuning.lightMul, 0.10, 0.86);
  return hslToRgb(h, s, l);
}

function rgba(rgb: { r: number; g: number; b: number }, alpha = 1): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getPalette(vibe: VibeValue, scheme: SchemeValue): { a: string; b: string; m: string; aSoft: string; bSoft: string; mSoft: string } {
  const base = VIBE_BASE_COLORS[vibe] || VIBE_BASE_COLORS.default;
  const tuning = SCHEME_TUNING[scheme] || SCHEME_TUNING.classic;
  const a = transformHex(base[0], tuning);
  const b = transformHex(base[1], tuning);
  const m = transformHex(base[2], tuning);
  return {
    a: rgba(a, 1),
    b: rgba(b, 1),
    m: rgba(m, 1),
    aSoft: rgba(a, tuning.softAlpha),
    bSoft: rgba(b, Math.max(0.16, tuning.softAlpha - 0.03)),
    mSoft: rgba(m, Math.min(0.36, tuning.softAlpha + 0.03))
  };
}

function getVibeIcons(vibe: VibeValue): { summary: string; research: string; ask: string; share: string; hide: string } {
  const summary = vibe === 'anime'
    ? 'fa-wand-magic-sparkles'
    : vibe === 'arcade'
      ? 'fa-trophy'
      : vibe === 'cinema'
        ? 'fa-film'
        : vibe === 'newspaper'
          ? 'fa-newspaper'
          : vibe === 'cyberwitch'
            ? 'fa-hat-wizard'
            : vibe === 'fantasy'
              ? 'fa-book-open'
              : vibe === 'scifi'
                ? 'fa-robot'
                : 'fa-file-lines';
  const research = vibe === 'anime'
    ? 'fa-dragon'
    : vibe === 'arcade'
      ? 'fa-crosshairs'
      : vibe === 'cinema'
        ? 'fa-clapperboard'
        : vibe === 'newspaper'
          ? 'fa-magnifying-glass'
          : vibe === 'cyberwitch'
            ? 'fa-bolt'
            : vibe === 'fantasy'
              ? 'fa-dragon'
              : vibe === 'scifi'
                ? 'fa-microchip'
                : 'fa-magnifying-glass';
  const share = vibe === 'anime'
    ? 'fa-paper-plane'
    : vibe === 'arcade'
      ? 'fa-share-nodes'
      : vibe === 'scifi'
        ? 'fa-shuttle-space'
        : vibe === 'cyberwitch'
          ? 'fa-satellite-dish'
          : 'fa-arrow-up-right-from-square';
  const hide = vibe === 'arcade'
    ? 'fa-skull-crossbones'
    : vibe === 'cinema'
      ? 'fa-masks-theater'
      : vibe === 'newspaper'
        ? 'fa-ban'
        : vibe === 'cyberwitch'
          ? 'fa-user-secret'
          : 'fa-eye-slash';
  const ask = vibe === 'anime'
    ? 'fa-comment-dots'
    : vibe === 'arcade'
      ? 'fa-headset'
      : vibe === 'cinema'
        ? 'fa-microphone-lines'
        : vibe === 'newspaper'
          ? 'fa-circle-question'
          : vibe === 'cyberwitch'
            ? 'fa-hand-sparkles'
            : vibe === 'fantasy'
              ? 'fa-scroll'
              : vibe === 'scifi'
                ? 'fa-user-astronaut'
                : 'fa-comments';

  return { summary, research, ask, share, hide };
}

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
  const vibe = useAppSelector(s => s.ui.vibe);
  const scheme = useAppSelector(s => s.ui.scheme);
  const buttonMode = useAppSelector(s => s.ui.buttonMode);
  const fontSize = useAppSelector(s => s.ui.fontSize);
  const notifyEnabled = useAppSelector(s => s.ui.notifyEnabled);
  const notifyMode = useAppSelector(s => s.ui.notifyMode);
  const hideAllResearchSeq = useAppSelector(s => s.ui.hideAllResearchSeq);
  const feeds = useAppSelector(s => s.feeds.feeds);
  const pinnedByUrl = useAppSelector(s => s.feeds.pinnedByUrl);
  const controlsOpenByUrl = useAppSelector(s => s.feeds.controlsOpenByUrl);
  const deleteAgeByUrl = useAppSelector(s => s.feeds.deleteAgeByUrl);
  const orderByUrl = useAppSelector(s => s.feeds.orderByUrl);
  const searchQuery = useAppSelector(s => s.ui.searchQuery);
  const allColumnControlsHidden = useAppSelector(s => s.ui.allColumnControlsHidden);
  const itemsByFeed = useAppSelector(s => s.news.itemsByFeed);
  const summaryPendingById = useAppSelector(s => s.news.summaryPendingById);
  const researchPendingById = useAppSelector(s => s.news.researchPendingById);
  const askByItem = useAppSelector(s => s.news.askByItem);
  const pendingTimeoutsRef = useRef<Record<string, number>>({});
  const researchTimeoutsRef = useRef<Record<string, number>>({});
  const hydratedFeedUiRef = useRef(false);
  const seenNewsIdsRef = useRef<Set<string>>(new Set());
  const notificationsPrimedRef = useRef(false);
  const [hideAllResearch, setHideAllResearch] = useState(false);
  const [bodyModes, setBodyModes] = useState<Record<string, BodyMode>>({});
  const [shareNoticeOpen, setShareNoticeOpen] = useState(false);
  const [dragFeedUrl, setDragFeedUrl] = useState<string | null>(null);
  const [dragOverFeedUrl, setDragOverFeedUrl] = useState<string | null>(null);
  const prevAllControlsHiddenRef = useRef<boolean | null>(null);
  const bg = language === 'bg';
  const l = useMemo(() => ({
    previewTitle: bg ? 'Колони На Живо' : 'Live Columns',
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
    const allItems = Object.entries(itemsByFeed).flatMap(([feedUrl, items]) =>
      (items || []).map(item => ({ feedUrl, item }))
    );
    if (!notificationsPrimedRef.current) {
      allItems.forEach(({ item }) => seenNewsIdsRef.current.add(item.id));
      notificationsPrimedRef.current = true;
      return;
    }

    if (!notifyEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      allItems.forEach(({ item }) => seenNewsIdsRef.current.add(item.id));
      return;
    }

    const shouldNotify = (feedUrl: string, it: NewsItem): boolean => {
      if (notifyMode === 'all') return true;
      if (notifyMode === 'pinned') return !!pinnedByUrl[feedUrl];
      if (notifyMode === 'matched_pinned') return !!it.isMatch && !!pinnedByUrl[feedUrl];
      return !!it.isMatch;
    };

    allItems.forEach(({ feedUrl, item }) => {
      if (seenNewsIdsRef.current.has(item.id)) return;
      seenNewsIdsRef.current.add(item.id);
      if (!shouldNotify(feedUrl, item)) return;
      const body = String(item.summary || item.research || '').trim();
      const n = new Notification(item.isMatch ? `MATCH · ${item.title}` : item.title, {
        body: body || item.link
      });
      n.onclick = () => window.open(item.link, '_blank', 'noopener,noreferrer');
    });
  }, [itemsByFeed, notifyEnabled, notifyMode, pinnedByUrl]);

  useEffect(() => {
    if (hideAllResearchSeq > 0) {
      setHideAllResearch(true);
    }
  }, [hideAllResearchSeq]);

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
        const aPinned = !!pinnedByUrl[a.url];
        const bPinned = !!pinnedByUrl[b.url];
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
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
  }, [feeds, itemsByFeed, orderByUrl, pinnedByUrl]);

  const renderedFeeds = useMemo(() => {
    if (!dragFeedUrl || !dragOverFeedUrl || dragFeedUrl === dragOverFeedUrl) return previewFeeds;
    const fromIdx = previewFeeds.findIndex(f => f.url === dragFeedUrl);
    const toIdx = previewFeeds.findIndex(f => f.url === dragOverFeedUrl);
    if (fromIdx < 0 || toIdx < 0) return previewFeeds;
    const next = [...previewFeeds];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    return next;
  }, [dragFeedUrl, dragOverFeedUrl, previewFeeds]);

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

  const fontScale = fontSize === 'xl' ? 1.17 : fontSize === 'lg' ? 1.09 : fontSize === 'sm' ? 0.93 : 1;
  const resolvedVibe: VibeValue = (Object.prototype.hasOwnProperty.call(VIBE_BASE_COLORS, vibe) ? vibe : 'default') as VibeValue;
  const resolvedScheme: SchemeValue = (Object.prototype.hasOwnProperty.call(SCHEME_TUNING, scheme) ? scheme : 'classic') as SchemeValue;
  const palette = useMemo(() => getPalette(resolvedVibe, resolvedScheme), [resolvedVibe, resolvedScheme]);
  const vibeIcons = useMemo(() => getVibeIcons(resolvedVibe), [resolvedVibe]);
  const compactBtnSx = {
    minHeight: 30,
    px: 1.15,
    py: 0.15,
    fontSize: `${0.82 * fontScale}rem`,
    lineHeight: 1.12
  };
  const compactFormSx = {
    '& .MuiOutlinedInput-root': {
      height: 34,
      fontSize: `${0.82 * fontScale}rem`,
      background: 'rgba(12,20,38,0.92)',
      color: 'rgba(231,240,255,0.96)',
      borderRadius: 999
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(122,149,194,0.44)'
    },
    '& .MuiSvgIcon-root': {
      color: 'rgba(203,217,243,0.9)'
    }
  };
  const labelSx = {
    m: 0,
    '& .MuiTypography-root': {
      fontSize: `${0.84 * fontScale}rem`,
      color: 'rgba(216,229,251,0.92)'
    },
    '& .MuiCheckbox-root': {
      color: 'rgba(157,187,237,0.88)'
    }
  };

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
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
        }}
      >
        {renderedFeeds.map((feed: FeedInfo) => {
          const columnIdx = Math.max(0, renderedFeeds.findIndex(f => f.url === feed.url));
          const isMatchColumn = feed.url === '__filtered__' || String(feed.label || '').toLowerCase().startsWith('filtered');
          const colTheme: 'a' | 'b' | 'match' = isMatchColumn ? 'match' : (columnIdx % 2 === 0 ? 'a' : 'b');
          const accent = colTheme === 'a' ? palette.a : colTheme === 'b' ? palette.b : palette.m;
          const soft = colTheme === 'a' ? palette.aSoft : colTheme === 'b' ? palette.bSoft : palette.mSoft;
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
          const isDragging = dragFeedUrl === feed.url;
          const isDropTarget = !!dragFeedUrl && dragFeedUrl !== feed.url && dragOverFeedUrl === feed.url;
          return (
            <Card
              key={feed.url}
              variant="outlined"
              draggable
              onDragStart={e => {
                setDragFeedUrl(feed.url);
                setDragOverFeedUrl(feed.url);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', feed.url);
              }}
              onDragEnd={() => {
                setDragFeedUrl(null);
                setDragOverFeedUrl(null);
              }}
              onDragEnter={() => {
                if (dragFeedUrl && dragFeedUrl !== feed.url) setDragOverFeedUrl(feed.url);
              }}
              onDragOver={e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragFeedUrl && dragFeedUrl !== feed.url && dragOverFeedUrl !== feed.url) {
                  setDragOverFeedUrl(feed.url);
                }
              }}
              onDrop={() => {
                if (dragFeedUrl && dragFeedUrl !== feed.url) {
                  dispatch(reorderFeeds({ fromUrl: dragFeedUrl, toUrl: feed.url }));
                }
                setDragFeedUrl(null);
                setDragOverFeedUrl(null);
              }}
              sx={{
                background: `linear-gradient(180deg, ${soft}, rgba(9, 15, 30, 0.96) 78%)`,
                borderColor: isDropTarget ? accent : (isDragging ? accent : 'rgba(97, 123, 161, 0.42)'),
                borderTop: `4px solid ${accent}`,
                boxShadow: isDropTarget ? `0 0 0 2px ${accent}66, 0 18px 34px rgba(0,0,0,0.30)` : '0 10px 22px rgba(0,0,0,0.22)',
                borderRadius: 16,
                color: 'rgba(234, 242, 255, 0.96)',
                opacity: isDragging ? 0.45 : 1,
                transform: isDragging ? 'scale(0.985)' : (isDropTarget ? 'translateY(-4px)' : 'translateY(0)'),
                transition: 'transform 130ms ease, box-shadow 130ms ease, opacity 130ms ease, border-color 130ms ease',
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
            >
              <CardContent sx={{ pb: '12px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                  <Typography variant="h6" sx={{ fontSize: `${18 * fontScale}px`, fontWeight: 800, lineHeight: 1.2, pr: 1, color: 'rgba(232,243,255,0.97)' }}>
                    {feed.label}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={itemsVisible.length} sx={{ color: 'rgba(231,242,255,0.96)', bgcolor: 'rgba(79, 114, 168, 0.24)', borderColor: accent }} />
                    <Chip size="small" variant="outlined" label={feed.kind} sx={{ color: 'rgba(231,242,255,0.96)', borderColor: accent }} />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 1.1 }} flexWrap="wrap">
                  <Button
                    size="small"
                    variant={pinned ? 'contained' : 'outlined'}
                    startIcon={pinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                    onClick={() => dispatch(togglePinned(feed.url))}
                    sx={compactBtnSx}
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
                    sx={compactBtnSx}
                  >
                    {l.remove}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<TuneIcon />}
                    onClick={() => dispatch(toggleFeedControls(feed.url))}
                    sx={compactBtnSx}
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
                      sx={compactBtnSx}
                    >
                      {feed.summaryEnabled ? l.summariesOn : l.summariesOff}
                    </Button>
                    <Button
                      size="small"
                      variant={feed.researchEnabled ? 'contained' : 'outlined'}
                      onClick={() => toggleFeedResearch(feed)}
                      disabled={!connected}
                      sx={compactBtnSx}
                    >
                      {feed.researchEnabled ? l.researchOn : l.researchOff}
                    </Button>
                    <FormControl size="small" sx={{ minWidth: 130, ...compactFormSx }}>
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
                    <FormControl size="small" sx={{ minWidth: 102, ...compactFormSx }}>
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
                    <FormControl size="small" sx={{ minWidth: 122, ...compactFormSx }}>
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
                      sx={labelSx}
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
                      sx={labelSx}
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
                      sx={labelSx}
                    />
                    <FormControl size="small" sx={{ minWidth: 138, ...compactFormSx }}>
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
                      sx={compactBtnSx}
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
                        background: `linear-gradient(155deg, rgba(5, 12, 25, 0.92), rgba(7, 14, 28, 0.86)), radial-gradient(550px 180px at 0% 0%, ${soft}, transparent 72%)`,
                        borderColor: it.isMatch ? palette.m : `${accent}88`,
                        color: 'rgba(234, 242, 255, 0.96)'
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
                                sx={{ ...compactBtnSx, minWidth: buttonMode === 'text' ? 72 : 34, px: buttonMode === 'text' ? 1.1 : 0.75 }}
                                onClick={() => copyLink(it.link)}
                              >
                                {buttonMode === 'text'
                                  ? l.shareLink
                                  : <><i className={`fa-solid ${vibeIcons.share} iconGlyph`} aria-hidden="true" /><span className="srOnly">{l.shareLink}</span></>}
                              </Button>
                            </Tooltip>
                            <Tooltip title={l.hideNews}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                sx={{ ...compactBtnSx, minWidth: buttonMode === 'text' ? 72 : 34, px: buttonMode === 'text' ? 1.1 : 0.75 }}
                                onClick={() => hideItem(it)}
                                disabled={!connected}
                              >
                                {buttonMode === 'text'
                                  ? l.hideNews
                                  : <><i className={`fa-solid ${vibeIcons.hide} iconGlyph`} aria-hidden="true" /><span className="srOnly">{l.hideNews}</span></>}
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
                            fontSize: `${1.03 * fontScale}rem`,
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
                              sx={{ ...compactBtnSx, minWidth: buttonMode === 'text' ? 84 : 34, px: buttonMode === 'text' ? 1.05 : 0.8 }}
                              onClick={() => requestSummary(it)}
                              disabled={!connected || !!summaryPendingById[it.id]}
                            >
                              {buttonMode === 'text'
                                ? (summaryPendingById[it.id] ? l.generatingSummary : l.summary)
                                : <><i className={`fa-solid ${summaryPendingById[it.id] ? 'fa-spinner fa-spin' : vibeIcons.summary} iconGlyph`} aria-hidden="true" /><span className="srOnly">{l.summary}</span></>}
                            </Button>
                            <Button
                              size="small"
                              variant={researchPendingById[it.id] ? 'contained' : 'outlined'}
                              sx={{ ...compactBtnSx, minWidth: buttonMode === 'text' ? 84 : 34, px: buttonMode === 'text' ? 1.05 : 0.8 }}
                              onClick={() => requestResearch(it)}
                              disabled={!connected || !!researchPendingById[it.id]}
                            >
                              {buttonMode === 'text'
                                ? (researchPendingById[it.id] ? l.researching : l.research)
                                : <><i className={`fa-solid ${researchPendingById[it.id] ? 'fa-spinner fa-spin' : vibeIcons.research} iconGlyph`} aria-hidden="true" /><span className="srOnly">{l.research}</span></>}
                            </Button>
                            <Button
                              size="small"
                              variant={askState.open ? 'contained' : 'outlined'}
                              sx={{ ...compactBtnSx, minWidth: buttonMode === 'text' ? 84 : 34, px: buttonMode === 'text' ? 1.05 : 0.8 }}
                              onClick={() => dispatch(toggleAskOpen({ id: it.id, feedUrl: it.feedUrl }))}
                              disabled={!connected}
                            >
                              {buttonMode === 'text'
                                ? l.askAgent
                                : <><i className={`fa-solid ${askState.pending ? 'fa-spinner fa-spin' : vibeIcons.ask} iconGlyph`} aria-hidden="true" /><span className="srOnly">{l.askAgent}</span></>}
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
