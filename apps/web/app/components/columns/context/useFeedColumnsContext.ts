'use client';

import { useContext } from 'react';
import { FeedColumnsContext, type FeedColumnsContextValue } from './FeedColumnsContext';

export function useFeedColumnsContext(): FeedColumnsContextValue {
  const ctx = useContext(FeedColumnsContext);
  if (!ctx) {
    throw new Error('useFeedColumnsContext must be used within FeedColumnsProvider');
  }
  return ctx;
}
