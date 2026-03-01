'use client';

import { shallowEqual } from 'react-redux';
import { useAppSelector } from '../../../store/hooks';

export function useReactColumnsState() {
  return useAppSelector(
    s => ({
      connection: s.connection,
      ui: s.ui,
      feeds: s.feeds,
      news: s.news
    }),
    shallowEqual
  );
}
