'use client';

import { useCallback } from 'react';
import { removeOldItemsInFeed, resetAllToNewestLimit } from '../../../store/slices/newsSlice';
import type { AppDispatch, RootState } from '../../../store/store';
import { cutoffFromAge, type TopMenuDeleteAge } from '../topMenu.services';

type Args = {
  dispatch: AppDispatch;
  feeds: RootState['feeds']['feeds'];
  deleteAgeAll: TopMenuDeleteAge;
};

export function useTopMenuMaintenanceActions({ dispatch, feeds, deleteAgeAll }: Args) {
  const resetAllNewest = useCallback(() => {
    dispatch(resetAllToNewestLimit(10));
  }, [dispatch]);

  const deleteOldAllColumns = useCallback(() => {
    const cutoffMs = cutoffFromAge(deleteAgeAll);
    feeds.forEach(feed => {
      dispatch(removeOldItemsInFeed({ feedUrl: feed.url, cutoffMs }));
    });
  }, [deleteAgeAll, dispatch, feeds]);

  return {
    resetAllNewest,
    deleteOldAllColumns
  };
}
