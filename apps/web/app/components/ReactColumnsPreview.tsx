'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type FeedInfo = {
  url: string;
  label: string;
  kind: 'rss' | 'reddit' | 'youtube';
  intervalSec: number;
};

type NewsItem = {
  id: string;
  title: string;
  link: string;
  publishedMs: number;
  feedUrl: string;
  isMatch: boolean;
  summary?: string;
  filteredOk?: boolean;
};

type Props = {
  wsUrl: string;
};

const FILTERED_FEED_URL = '__filtered__';
const MAX_COLUMNS = 3;
const MAX_ITEMS_PER_COLUMN = 6;

function resolveWsUrl(explicitUrl: string): string {
  if (explicitUrl && explicitUrl.trim()) return explicitUrl.trim();
  if (typeof window !== 'undefined') {
    const globalUrl = (window as unknown as { __AI_NEWS_WS_URL?: string }).__AI_NEWS_WS_URL;
    if (globalUrl && globalUrl.trim()) return globalUrl.trim();
    return `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}`;
  }
  return 'ws://localhost:4000';
}

function asFeedInfoArray(v: unknown): FeedInfo[] {
  if (!Array.isArray(v)) return [];
  const out: FeedInfo[] = [];
  for (const x of v) {
    if (!x || typeof x !== 'object') continue;
    const m = x as Record<string, unknown>;
    const url = typeof m.url === 'string' ? m.url : '';
    if (!url || url === FILTERED_FEED_URL) continue;
    out.push({
      url,
      label: typeof m.label === 'string' && m.label.trim() ? m.label : url,
      kind: m.kind === 'reddit' || m.kind === 'youtube' ? m.kind : 'rss',
      intervalSec: typeof m.intervalSec === 'number' ? m.intervalSec : 120
    });
  }
  return out;
}

function asNewsItem(v: unknown): NewsItem | null {
  if (!v || typeof v !== 'object') return null;
  const m = v as Record<string, unknown>;
  if (m.type !== 'news') return null;
  const id = typeof m.id === 'string' ? m.id : '';
  const title = typeof m.title === 'string' ? m.title : '';
  const link = typeof m.link === 'string' ? m.link : '';
  const feedUrl = typeof m.feedUrl === 'string' ? m.feedUrl : '';
  if (!id || !title || !feedUrl) return null;
  return {
    id,
    title,
    link: link || '#',
    feedUrl,
    publishedMs: typeof m.publishedMs === 'number' ? m.publishedMs : Date.now(),
    isMatch: !!m.isMatch,
    summary: typeof m.summary === 'string' ? m.summary : '',
    filteredOk: typeof m.filteredOk === 'boolean' ? m.filteredOk : true
  };
}

function formatTime(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  try {
    return new Date(ms).toLocaleString('bg-BG', { hour12: false });
  } catch {
    return '';
  }
}

export default function ReactColumnsPreview({ wsUrl }: Props) {
  const [connected, setConnected] = useState(false);
  const [feeds, setFeeds] = useState<FeedInfo[]>([]);
  const [itemsByFeed, setItemsByFeed] = useState<Record<string, NewsItem[]>>({});
  const hiddenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const url = resolveWsUrl(wsUrl);
    const ws = new WebSocket(url);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

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
        const nextFeeds = asFeedInfoArray(msg.feeds);
        if (nextFeeds.length) setFeeds(nextFeeds);

        const hidden = new Set<string>();
        if (Array.isArray(msg.hiddenIds)) {
          for (const id of msg.hiddenIds) {
            if (typeof id === 'string' && id) hidden.add(id);
          }
        }
        hiddenIdsRef.current = hidden;
        return;
      }

      const news = asNewsItem(msg);
      if (!news) return;
      if (hiddenIdsRef.current.has(news.id)) return;
      if (news.filteredOk === false) return;

      setItemsByFeed(prev => {
        const next = { ...prev };
        const list = Array.isArray(next[news.feedUrl]) ? [...next[news.feedUrl]] : [];
        const idx = list.findIndex(x => x.id === news.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...news };
        else list.push(news);
        list.sort((a, b) => b.publishedMs - a.publishedMs);
        next[news.feedUrl] = list.slice(0, MAX_ITEMS_PER_COLUMN);
        return next;
      });
    };

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  const previewFeeds = useMemo(() => {
    if (feeds.length) return feeds.slice(0, MAX_COLUMNS);
    const fallback = Object.keys(itemsByFeed).slice(0, MAX_COLUMNS).map(url => ({
      url,
      label: url,
      kind: 'rss' as const,
      intervalSec: 120
    }));
    return fallback;
  }, [feeds, itemsByFeed]);

  return (
    <section className="container reactPreviewWrap">
      <div className="reactPreviewHead">
        <div className="reactPreviewTitle">React Renderer Preview</div>
        <div className={`reactPreviewStatus ${connected ? 'ok' : 'off'}`}>
          {connected ? 'Live via WebSocket' : 'Disconnected'}
        </div>
      </div>
      <div className="reactPreviewGrid">
        {previewFeeds.map((feed, i) => {
          const items = itemsByFeed[feed.url] || [];
          const theme = i % 2 === 0 ? 'a' : 'b';
          return (
            <article key={feed.url} className="column" data-coltheme={theme}>
              <div className="colHeader">
                <div className="colTitleRow">
                  <div className="colTitle">{feed.label}</div>
                  <span className="countBadge">{items.length}</span>
                  <span className="badge">{feed.kind}</span>
                </div>
              </div>
              <div className="items">
                {items.length === 0 ? (
                  <div className="item">
                    <div className="bodyText">Waiting for news…</div>
                  </div>
                ) : items.map(it => (
                  <div key={it.id} className={`item ${it.isMatch ? 'keywordMatch' : ''}`}>
                    <div className="timeRow">
                      <div className="time">{formatTime(it.publishedMs)}</div>
                      {it.isMatch ? <div className="matchTag">MATCH</div> : null}
                    </div>
                    <a className="headline" href={it.link} target="_blank" rel="noreferrer">
                      {it.title}
                    </a>
                    {it.summary ? <div className="bodyText">{it.summary}</div> : null}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
