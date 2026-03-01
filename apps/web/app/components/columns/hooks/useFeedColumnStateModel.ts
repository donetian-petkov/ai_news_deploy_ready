'use client';

import { useMemo } from 'react';
import type { FeedColumnStateModel } from '../reactColumns.types';

type Args = FeedColumnStateModel;

export function useFeedColumnStateModel(args: Args) {
  return useMemo<FeedColumnStateModel>(() => ({
    filteredColumnItems: args.filteredColumnItems,
    itemsByFeed: args.itemsByFeed,
    visibleByFeed: args.visibleByFeed,
    hydratedColumns: args.hydratedColumns,
    pinnedByUrl: args.pinnedByUrl,
    controlsOpenByUrl: args.controlsOpenByUrl,
    advancedControlsByUrl: args.advancedControlsByUrl,
    deleteAgeByUrl: args.deleteAgeByUrl,
    summaryPendingById: args.summaryPendingById,
    researchPendingById: args.researchPendingById,
    pinnedNewsById: args.pinnedNewsById,
    askByItem: args.askByItem,
    bodyModes: args.bodyModes
  }), [
    args.advancedControlsByUrl,
    args.askByItem,
    args.bodyModes,
    args.controlsOpenByUrl,
    args.deleteAgeByUrl,
    args.filteredColumnItems,
    args.hydratedColumns,
    args.itemsByFeed,
    args.pinnedByUrl,
    args.pinnedNewsById,
    args.researchPendingById,
    args.summaryPendingById,
    args.visibleByFeed
  ]);
}
