'use client';

import type { PropsWithChildren } from 'react';
import { FeedColumnsContext, type FeedColumnsContextValue } from './FeedColumnsContext';

type FeedColumnsProviderProps = PropsWithChildren<{
  value: FeedColumnsContextValue;
}>;

export function FeedColumnsProvider({ value, children }: FeedColumnsProviderProps) {
  return (
    <FeedColumnsContext.Provider value={value}>
      {children}
    </FeedColumnsContext.Provider>
  );
}

