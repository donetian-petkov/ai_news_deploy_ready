'use client';

import type { AppDispatch } from './store';
import type { BudgetMode, FeedInfo, NewsItem, SortMode } from './types';
import { FILTERED_FEED_URL } from './constants';
import { setStatus } from './slices/connectionSlice';
import { setFeeds } from './slices/feedsSlice';
import { receiveAskReply, setHiddenIds, upsertNewsItem } from './slices/newsSlice';
import { setUsage } from './slices/aiUsageSlice';
import { setAiSettings } from './slices/uiSlice';

let ws: WebSocket | null = null;
let wsUrlCurrent = '';
let hiddenIds = new Set<string>();

type FeedSettingsWire = {
  summaryEnabled?: unknown;
  researchEnabled?: unknown;
  budget?: unknown;
  sortMode?: unknown;
  filters?: unknown;
};

function parseFeedInfos(v: unknown, feedSettingsRaw: unknown): FeedInfo[] {
  if (!Array.isArray(v)) return [];
  const feedSettings = (feedSettingsRaw && typeof feedSettingsRaw === 'object')
    ? (feedSettingsRaw as Record<string, FeedSettingsWire>)
    : {};
  const out: FeedInfo[] = [];
  for (const x of v) {
    if (!x || typeof x !== 'object') continue;
    const m = x as Record<string, unknown>;
    const url = typeof m.url === 'string' ? m.url : '';
    if (!url || url === FILTERED_FEED_URL) continue;

    const rawSettings = (feedSettings[url] && typeof feedSettings[url] === 'object')
      ? feedSettings[url]
      : {};
    const budget = rawSettings.budget === 'low' || rawSettings.budget === 'standard' || rawSettings.budget === 'high'
      ? rawSettings.budget as BudgetMode
      : 'standard';
    const sortMode = rawSettings.sortMode === 'newest' || rawSettings.sortMode === 'oldest' || rawSettings.sortMode === 'matched'
      ? rawSettings.sortMode as SortMode
      : 'newest';
    const filtersRaw = (rawSettings.filters && typeof rawSettings.filters === 'object')
      ? rawSettings.filters as Record<string, unknown>
      : {};

    out.push({
      url,
      label: typeof m.label === 'string' && m.label.trim() ? m.label : url,
      kind: m.kind === 'reddit' || m.kind === 'youtube' ? m.kind : 'rss',
      intervalSec: typeof m.intervalSec === 'number' ? m.intervalSec : 120,
      summaryEnabled: typeof rawSettings.summaryEnabled === 'boolean' ? rawSettings.summaryEnabled : false,
      researchEnabled: typeof rawSettings.researchEnabled === 'boolean' ? rawSettings.researchEnabled : false,
      budget,
      sortMode,
      filters: {
        onlyMatches: !!filtersRaw.onlyMatches,
        onlyResearched: !!filtersRaw.onlyResearched,
        onlySummaries: !!filtersRaw.onlySummaries
      }
    });
  }
  return out;
}

function deriveAllBudget(feeds: FeedInfo[]): 'mixed' | 'low' | 'standard' | 'high' {
  if (!feeds.length) return 'standard';
  const first = feeds[0].budget;
  for (const f of feeds) {
    if (f.budget !== first) return 'mixed';
  }
  return first;
}

function parseNews(v: unknown): NewsItem | null {
  if (!v || typeof v !== 'object') return null;
  const m = v as Record<string, unknown>;
  if (m.type !== 'news') return null;
  const id = typeof m.id === 'string' ? m.id : '';
  const title = typeof m.title === 'string' ? m.title : '';
  const feedUrl = typeof m.feedUrl === 'string' ? m.feedUrl : '';
  if (!id || !title || !feedUrl) return null;
  return {
    id,
    title,
    link: typeof m.link === 'string' && m.link ? m.link : '#',
    feedUrl,
    publishedMs: typeof m.publishedMs === 'number' ? m.publishedMs : Date.now(),
    isMatch: !!m.isMatch,
    summary: typeof m.summary === 'string' ? m.summary : '',
    research: typeof m.research === 'string' ? m.research : '',
    filteredOk: typeof m.filteredOk === 'boolean' ? m.filteredOk : true
  };
}

function resolveWsUrl(explicitUrl: string): string {
  if (explicitUrl && explicitUrl.trim()) return explicitUrl.trim();
  if (typeof window !== 'undefined') {
    const globalUrl = (window as unknown as { __AI_NEWS_WS_URL?: string }).__AI_NEWS_WS_URL;
    if (globalUrl && globalUrl.trim()) return globalUrl.trim();
    return `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}`;
  }
  return 'ws://localhost:4000';
}

export function startWsConnection(dispatch: AppDispatch, explicitUrl: string) {
  const nextUrl = resolveWsUrl(explicitUrl);
  if (ws && wsUrlCurrent === nextUrl && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  if (ws) {
    try { ws.close(); } catch {}
  }

  wsUrlCurrent = nextUrl;
  ws = new WebSocket(nextUrl);
  dispatch(setStatus('connecting'));

  ws.onopen = () => {
    dispatch(setStatus('connected'));
  };

  ws.onclose = () => {
    dispatch(setStatus('disconnected'));
  };

  ws.onerror = () => {
    dispatch(setStatus('error'));
  };

  ws.onmessage = (event: MessageEvent<string>) => {
    let raw: unknown;
    try {
      raw = JSON.parse(String(event.data || ''));
    } catch {
      return;
    }
    if (!raw || typeof raw !== 'object') return;
    const msg = raw as Record<string, unknown>;

    if (msg.type === 'config') {
      const parsedFeeds = parseFeedInfos(msg.feeds, msg.feedSettings);
      dispatch(setFeeds(parsedFeeds));
      dispatch(setAiSettings({
        aiAvailable: !!msg.aiAvailable,
        aiEnabled: !!msg.aiEnabled,
        summaryLang: msg.summaryLang === 'bg' || msg.summaryLang === 'en' || msg.summaryLang === 'bilingual'
          ? msg.summaryLang
          : 'bilingual',
        researchLang: msg.researchLang === 'bg' || msg.researchLang === 'en'
          ? msg.researchLang
          : 'bg',
        allBudget: deriveAllBudget(parsedFeeds)
      }));

      const hidden: string[] = [];
      if (Array.isArray(msg.hiddenIds)) {
        for (const id of msg.hiddenIds) {
          if (typeof id === 'string' && id) hidden.push(id);
        }
      }
      hiddenIds = new Set(hidden);
      dispatch(setHiddenIds(hidden));

      dispatch(setUsage({
        inputTokens: typeof msg.aiUsageInputTokens === 'number' ? msg.aiUsageInputTokens : 0,
        outputTokens: typeof msg.aiUsageOutputTokens === 'number' ? msg.aiUsageOutputTokens : 0,
        totalTokens: typeof msg.aiUsageTotalTokens === 'number' ? msg.aiUsageTotalTokens : 0
      }));
      return;
    }

    if (msg.type === 'ai_usage') {
      dispatch(setUsage({
        inputTokens: typeof msg.inputTokens === 'number' ? msg.inputTokens : 0,
        outputTokens: typeof msg.outputTokens === 'number' ? msg.outputTokens : 0,
        totalTokens: typeof msg.totalTokens === 'number' ? msg.totalTokens : 0
      }));
      return;
    }

    if (msg.type === 'ask_agent_reply') {
      const id = typeof msg.id === 'string' ? msg.id : '';
      const feedUrl = typeof msg.feedUrl === 'string' ? msg.feedUrl : '';
      if (!id || !feedUrl) return;
      dispatch(receiveAskReply({
        id,
        feedUrl,
        question: typeof msg.question === 'string' ? msg.question : '',
        answer: typeof msg.answer === 'string' ? msg.answer : undefined,
        error: typeof msg.error === 'string' ? msg.error : undefined,
        used: typeof msg.used === 'number' ? msg.used : undefined,
        remaining: typeof msg.remaining === 'number' ? msg.remaining : undefined
      }));
      return;
    }

    const news = parseNews(msg);
    if (!news) return;
    if (hiddenIds.has(news.id)) return;
    dispatch(upsertNewsItem(news));
  };
}

export function stopWsConnection() {
  if (!ws) return;
  try { ws.close(); } catch {}
  ws = null;
  wsUrlCurrent = '';
}

export function sendWsMessage(payload: unknown): boolean {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify(payload));
  return true;
}
