'use client';

import { createContext, useContext } from 'react';
import type { SxProps, Theme } from '@mui/material';
import type { NewsCardHandlers, NewsCardStateModel, NewsCardViewModel } from '../newsCard.types';

export type NewsCardContextValue = {
  view: NewsCardViewModel;
  state: NewsCardStateModel;
  handlers: NewsCardHandlers;
  ui: {
    iconOnly: boolean;
    hasSummaryBlock: boolean;
    hasResearchBlock: boolean;
    hasBodyBlock: boolean;
    researchToggleActive: boolean;
    summaryVisible: boolean;
    researchVisible: boolean;
    actionSx: SxProps<Theme>;
    matchActionSx: SxProps<Theme>;
  };
};

export const NewsCardContext = createContext<NewsCardContextValue | null>(null);

export function useNewsCardContext(): NewsCardContextValue {
  const ctx = useContext(NewsCardContext);
  if (!ctx) {
    throw new Error('useNewsCardContext must be used within NewsCardProvider');
  }
  return ctx;
}
