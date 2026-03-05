'use client';

import { useContext } from 'react';
import { TopMenuContext, type TopMenuContextValue } from './TopMenuContext';

export function useTopMenuContext(): TopMenuContextValue {
  const ctx = useContext(TopMenuContext);
  if (!ctx) {
    throw new Error('useTopMenuContext must be used within TopMenuProvider');
  }
  return ctx;
}
