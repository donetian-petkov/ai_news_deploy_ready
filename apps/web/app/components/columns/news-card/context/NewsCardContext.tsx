'use client';

import { createContext } from 'react';
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
