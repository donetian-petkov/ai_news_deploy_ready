'use client';

import { useEffect, useRef } from 'react';
import type { AppDispatch } from '../../../store/store';
import { setAllFeedControlsOpen } from '../../../store/slices/feedsSlice';

type Args = {
  dispatch: AppDispatch;
  allColumnControlsHidden: boolean;
  feedsCount: number;
};

export function useAllColumnControlsSync({
  dispatch,
  allColumnControlsHidden,
  feedsCount
}: Args) {
  const prevAllControlsHiddenRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!feedsCount) return;
    if (prevAllControlsHiddenRef.current === null) {
      prevAllControlsHiddenRef.current = allColumnControlsHidden;
      if (allColumnControlsHidden) {
        dispatch(setAllFeedControlsOpen(false));
      }
      return;
    }

    if (prevAllControlsHiddenRef.current !== allColumnControlsHidden) {
      dispatch(setAllFeedControlsOpen(!allColumnControlsHidden));
      prevAllControlsHiddenRef.current = allColumnControlsHidden;
      return;
    }

    if (allColumnControlsHidden) {
      dispatch(setAllFeedControlsOpen(false));
    }
  }, [allColumnControlsHidden, dispatch, feedsCount]);
}
