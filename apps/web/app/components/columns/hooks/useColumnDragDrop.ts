'use client';

import { useCallback, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import type { AppDispatch } from '../../../store/store';
import { reorderFeeds } from '../../../store/slices/feedsSlice';
import type { FeedInfo } from '../../../store/types';
import type { FeedColumnDragState } from '../reactColumns.types';

type UseColumnDragDropArgs = {
  dispatch: AppDispatch;
  renderedFeeds: FeedInfo[];
};

export function useColumnDragDrop({ dispatch, renderedFeeds }: UseColumnDragDropArgs) {
  const [dragFeedUrl, setDragFeedUrl] = useState<string | null>(null);
  const [dragOverFeedUrl, setDragOverFeedUrl] = useState<string | null>(null);
  const dragCommittedRef = useRef(false);
  const dragLastTargetRef = useRef<string | null>(null);
  const columnNodesRef = useRef<Record<string, HTMLDivElement | null>>({});

  const onGridDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (!dragFeedUrl) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [dragFeedUrl]);

  const onGridDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
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
  }, [dispatch, dragFeedUrl, renderedFeeds]);

  const buildDragState = useCallback((feed: FeedInfo, canDrag: boolean): FeedColumnDragState => ({
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
  }), [dispatch, dragFeedUrl, dragOverFeedUrl]);

  return {
    columnNodesRef,
    onGridDragOver,
    onGridDrop,
    buildDragState
  };
}
