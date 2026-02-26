'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MAX_COLUMNS } from '../store/constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearSummaryForItem, clearSummaryPending, setSummaryPending } from '../store/slices/newsSlice';
import { sendWsMessage, startWsConnection, stopWsConnection } from '../store/wsClient';
import type { FeedInfo, NewsItem } from '../store/types';

type Props = {
  wsUrl: string;
};

function formatTime(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  try {
    return new Date(ms).toLocaleString('bg-BG', { hour12: false });
  } catch {
    return '';
  }
}

export default function ReactColumnsPreview({ wsUrl }: Props) {
  const dispatch = useAppDispatch();
  const connected = useAppSelector(s => s.connection.connected);
  const status = useAppSelector(s => s.connection.status);
  const feeds = useAppSelector(s => s.feeds.feeds);
  const itemsByFeed = useAppSelector(s => s.news.itemsByFeed);
  const summaryPendingById = useAppSelector(s => s.news.summaryPendingById);
  const pendingTimeoutsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    startWsConnection(dispatch, wsUrl);

    return () => {
      stopWsConnection();
      const ids = Object.keys(pendingTimeoutsRef.current);
      for (const id of ids) {
        window.clearTimeout(pendingTimeoutsRef.current[id]);
      }
      pendingTimeoutsRef.current = {};
    };
  }, [dispatch, wsUrl]);

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
    if (!ok) {
      dispatch(clearSummaryPending(it.id));
    }
  };

  return (
    <section className="container reactPreviewWrap">
      <div className="reactPreviewHead">
        <div className="reactPreviewTitle">React Renderer Preview</div>
        <div className={`reactPreviewStatus ${connected ? 'ok' : 'off'}`}>
          {connected ? 'Live via WebSocket' : `Disconnected (${status})`}
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
                    <div className="reactPreviewActions">
                      <button
                        className="reactPreviewActionBtn"
                        type="button"
                        onClick={() => requestSummary(it)}
                        disabled={!connected || !!summaryPendingById[it.id]}
                      >
                        {summaryPendingById[it.id] ? 'Generating Summary…' : 'Summary'}
                      </button>
                    </div>
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
