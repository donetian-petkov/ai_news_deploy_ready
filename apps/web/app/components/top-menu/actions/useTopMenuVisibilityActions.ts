'use client';

import { useCallback } from 'react';
import { setTopUiState } from '../../../store/slices/uiSlice';
import type { AppDispatch, RootState } from '../../../store/store';
import type { TopMenuFocusTarget } from '../types';

type Args = {
  dispatch: AppDispatch;
  ui: RootState['ui'];
  isMobile: boolean;
  setMobileDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  scheduleFocus: (target: TopMenuFocusTarget, delay?: number) => void;
};

export function useTopMenuVisibilityActions({
  dispatch,
  ui,
  isMobile,
  setMobileDrawerOpen,
  scheduleFocus
}: Args) {
  const desktopSearchPanelVisible = !ui.menuCollapsed && ui.searchVisible && !ui.addStreamVisible && ui.controlsCollapsed;
  const desktopAddStreamPanelVisible = !ui.menuCollapsed && ui.addStreamVisible && !ui.searchVisible && ui.controlsCollapsed;
  const desktopControlsPanelVisible = !ui.menuCollapsed && !ui.controlsCollapsed && !ui.searchVisible && !ui.addStreamVisible;
  const desktopMenuVisible = desktopSearchPanelVisible || desktopAddStreamPanelVisible || desktopControlsPanelVisible;

  const toggleSearch = useCallback(() => {
    const nextSearchVisible = !desktopSearchPanelVisible;
    if (isMobile) {
      setMobileDrawerOpen(true);
      dispatch(setTopUiState({ menuCollapsed: false, searchVisible: nextSearchVisible }));
      if (nextSearchVisible) scheduleFocus('search', 80);
      return;
    }

    dispatch(setTopUiState({
      menuCollapsed: !nextSearchVisible,
      controlsCollapsed: true,
      searchVisible: nextSearchVisible,
      addStreamVisible: false
    }));
    if (nextSearchVisible) scheduleFocus('search', 30);
  }, [desktopSearchPanelVisible, dispatch, isMobile, scheduleFocus, setMobileDrawerOpen]);

  const toggleAddStream = useCallback(() => {
    const nextAddStreamVisible = !desktopAddStreamPanelVisible;
    if (isMobile) {
      setMobileDrawerOpen(true);
      dispatch(setTopUiState({ menuCollapsed: false, addStreamVisible: nextAddStreamVisible }));
      if (nextAddStreamVisible) scheduleFocus('addStream', 80);
      return;
    }

    dispatch(setTopUiState({
      menuCollapsed: !nextAddStreamVisible,
      controlsCollapsed: true,
      searchVisible: false,
      addStreamVisible: nextAddStreamVisible
    }));
    if (nextAddStreamVisible) scheduleFocus('addStream', 30);
  }, [desktopAddStreamPanelVisible, dispatch, isMobile, scheduleFocus, setMobileDrawerOpen]);

  const toggleControls = useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(true);
      dispatch(setTopUiState({ menuCollapsed: false, controlsCollapsed: false }));
      return;
    }

    dispatch(setTopUiState({
      menuCollapsed: false,
      controlsCollapsed: false,
      searchVisible: false,
      addStreamVisible: false
    }));
  }, [dispatch, isMobile, setMobileDrawerOpen]);

  const toggleMenu = useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(prev => !prev);
      return;
    }

    const nextMenuCollapsed = desktopMenuVisible;
    dispatch(setTopUiState({
      menuCollapsed: nextMenuCollapsed,
      controlsCollapsed: nextMenuCollapsed ? true : false,
      searchVisible: false,
      addStreamVisible: false
    }));
  }, [desktopMenuVisible, dispatch, isMobile, setMobileDrawerOpen]);

  const toggleAllColumnControls = useCallback(() => {
    dispatch(setTopUiState({ allColumnControlsHidden: !ui.allColumnControlsHidden }));
  }, [dispatch, ui.allColumnControlsHidden]);

  return {
    toggleSearch,
    toggleAddStream,
    toggleControls,
    toggleMenu,
    toggleAllColumnControls
  };
}
