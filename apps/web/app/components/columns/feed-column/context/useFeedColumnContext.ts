'use client';

import { useContext } from 'react';
import { FeedColumnContext, type FeedColumnContextValue } from './FeedColumnContext';

export function useFeedColumnContext(): FeedColumnContextValue {
  const ctx = useContext(FeedColumnContext);
  if (!ctx) {
    throw new Error('useFeedColumnContext must be used within FeedColumnProvider');
  }
  return ctx;
}
