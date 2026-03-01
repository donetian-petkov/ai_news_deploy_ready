'use client';

import { useCallback } from 'react';
import { sendWsMessage } from '../../../store/wsClient';
import type { AddStatus, FeedType } from '../types';

type Args = {
  feedType: FeedType;
  feedUrl: string;
  feedLabel: string;
  feedInterval: string;
  labels: Record<string, string>;
  setAddStatus: React.Dispatch<React.SetStateAction<AddStatus>>;
  setFeedUrl: React.Dispatch<React.SetStateAction<string>>;
  setFeedLabel: React.Dispatch<React.SetStateAction<string>>;
};

export function useTopMenuAddStreamAction({
  feedType,
  feedUrl,
  feedLabel,
  feedInterval,
  labels,
  setAddStatus,
  setFeedUrl,
  setFeedLabel
}: Args) {
  return useCallback(() => {
    if (!feedUrl.trim()) {
      setAddStatus({ kind: 'error', message: labels.enterValue });
      return;
    }

    setAddStatus({ kind: 'info', message: labels.adding });
    const ok = sendWsMessage({
      type: 'add_feed',
      kind: feedType,
      url: feedUrl.trim(),
      label: feedLabel.trim(),
      intervalSec: Number(feedInterval) || 120
    });

    if (!ok) {
      setAddStatus({ kind: 'error', message: labels.noServerConnection });
      return;
    }

    setAddStatus({ kind: 'success', message: labels.streamSubmitted });
    setFeedUrl('');
    setFeedLabel('');
  }, [feedInterval, feedLabel, feedType, feedUrl, labels.adding, labels.enterValue, labels.noServerConnection, labels.streamSubmitted, setAddStatus, setFeedLabel, setFeedUrl]);
}
