'use client';

import { useContext } from 'react';
import { NewsCardContext, type NewsCardContextValue } from './NewsCardContext';

export function useNewsCardContext(): NewsCardContextValue {
  const ctx = useContext(NewsCardContext);
  if (!ctx) {
    throw new Error('useNewsCardContext must be used within NewsCardProvider');
  }
  return ctx;
}
