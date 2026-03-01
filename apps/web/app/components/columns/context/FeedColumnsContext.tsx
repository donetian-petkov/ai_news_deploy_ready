'use client';

import type { DragEvent, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';
import type { FeedInfo } from '../../../store/types';
import type {
  FeedColumnDragState,
  FeedColumnHandlers,
  FeedColumnStateModel,
  FeedColumnViewModel
} from '../reactColumns.types';

type FeedColumnsContextValue = {
  view: FeedColumnViewModel;
  state: FeedColumnStateModel;
  handlers: FeedColumnHandlers;
  onGridDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onGridDrop: (e: DragEvent<HTMLDivElement>) => void;
  buildDragState: (feed: FeedInfo, canDrag: boolean) => FeedColumnDragState;
};

const FeedColumnsContext = createContext<FeedColumnsContextValue | null>(null);

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

export function useFeedColumnsContext(): FeedColumnsContextValue {
  const ctx = useContext(FeedColumnsContext);
  if (!ctx) {
    throw new Error('useFeedColumnsContext must be used within FeedColumnsProvider');
  }
  return ctx;
}

