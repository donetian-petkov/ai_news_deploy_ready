'use client';

import type { DragEvent } from 'react';
import { createContext, useContext } from 'react';
import type { FeedInfo } from '../../../store/types';
import type {
  FeedColumnDragState,
  FeedColumnHandlers,
  FeedColumnStateModel,
  FeedColumnViewModel
} from '../reactColumns.types';

export type FeedColumnsContextValue = {
  view: FeedColumnViewModel;
  state: FeedColumnStateModel;
  handlers: FeedColumnHandlers;
  onGridDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onGridDrop: (e: DragEvent<HTMLDivElement>) => void;
  buildDragState: (feed: FeedInfo, canDrag: boolean) => FeedColumnDragState;
};

export const FeedColumnsContext = createContext<FeedColumnsContextValue | null>(null);

export function useFeedColumnsContext(): FeedColumnsContextValue {
  const ctx = useContext(FeedColumnsContext);
  if (!ctx) {
    throw new Error('useFeedColumnsContext must be used within FeedColumnsProvider');
  }
  return ctx;
}
