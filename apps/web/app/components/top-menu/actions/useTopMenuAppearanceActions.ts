'use client';

import { useCallback } from 'react';
import { setAppearanceSettings } from '../../../store/slices/uiSlice';
import type { AppDispatch, RootState } from '../../../store/store';
import { getNextColorMode, getNextVibe } from '../topMenu.services';

type Args = {
  dispatch: AppDispatch;
  ui: RootState['ui'];
};

export function useTopMenuAppearanceActions({ dispatch, ui }: Args) {
  const cycleTheme = useCallback(() => {
    dispatch(setAppearanceSettings({ colorMode: getNextColorMode(ui.colorMode) }));
  }, [dispatch, ui.colorMode]);

  const cycleVibe = useCallback(() => {
    dispatch(setAppearanceSettings({ vibe: getNextVibe(ui.vibe) }));
  }, [dispatch, ui.vibe]);

  return {
    cycleTheme,
    cycleVibe
  };
}
