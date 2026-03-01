'use client';

import { useEffect, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { FeedInfo } from '../../../store/types';

type Args = {
  renderedFeeds: FeedInfo[];
  showMoreNewsAllSeq: number;
  resetNewsShownAllSeq: number;
  columnNodesRef: MutableRefObject<Record<string, HTMLDivElement | null>>;
};

export function useColumnHydration({
  renderedFeeds,
  showMoreNewsAllSeq,
  resetNewsShownAllSeq,
  columnNodesRef
}: Args) {
  const [visibleByFeed, setVisibleByFeed] = useState<Record<string, number>>({});
  const [hydratedColumns, setHydratedColumns] = useState<Record<string, true>>({});

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
  }, [columnNodesRef, renderedFeeds]);

  return {
    visibleByFeed,
    setVisibleByFeed,
    hydratedColumns,
    setHydratedColumns
  };
}
