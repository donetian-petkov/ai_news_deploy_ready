'use client';

import type { RootState } from '../../store/store';

export type AddStatus = { kind: 'info' | 'success' | 'error'; message: string } | null;
export type FeedType = 'rss' | 'reddit' | 'youtube';
export type TopMenuUiState = RootState['ui'];

