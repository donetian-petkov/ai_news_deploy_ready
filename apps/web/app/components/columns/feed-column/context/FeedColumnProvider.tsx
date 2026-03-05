'use client';

import type { PropsWithChildren } from 'react';
import { FeedColumnContext, type FeedColumnContextValue } from './FeedColumnContext';

type Props = PropsWithChildren<{
  value: FeedColumnContextValue;
}>;

export function FeedColumnProvider({ value, children }: Props) {
  return (
    <FeedColumnContext.Provider value={value}>
      {children}
    </FeedColumnContext.Provider>
  );
}
