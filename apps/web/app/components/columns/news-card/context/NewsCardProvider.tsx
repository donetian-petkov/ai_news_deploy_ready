'use client';

import type { PropsWithChildren } from 'react';
import { NewsCardContext, type NewsCardContextValue } from './NewsCardContext';

type Props = PropsWithChildren<{ value: NewsCardContextValue }>;

export function NewsCardProvider({ value, children }: Props) {
  return <NewsCardContext.Provider value={value}>{children}</NewsCardContext.Provider>;
}
