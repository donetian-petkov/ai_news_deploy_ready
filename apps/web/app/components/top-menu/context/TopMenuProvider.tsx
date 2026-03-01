'use client';

import type { PropsWithChildren } from 'react';
import { TopMenuContext, type TopMenuContextValue } from './TopMenuContext';

type TopMenuProviderProps = PropsWithChildren<{
  value: TopMenuContextValue;
}>;

export function TopMenuProvider({ value, children }: TopMenuProviderProps) {
  return (
    <TopMenuContext.Provider value={value}>
      {children}
    </TopMenuContext.Provider>
  );
}

