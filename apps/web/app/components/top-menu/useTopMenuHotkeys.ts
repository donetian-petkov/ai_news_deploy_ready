'use client';

import { useEffect, useRef } from 'react';

type UseTopMenuHotkeysArgs = {
  searchVisible: boolean;
  onCloseHelp: () => void;
  onToggleHelp: () => void;
  onFocusSearch: () => void;
  onToggleMenu: () => void;
  onToggleControls: () => void;
  onToggleAllColumnControls: () => void;
  onToggleSearch: () => void;
  onToggleAddStream: () => void;
  onCycleTheme: () => void;
  onCycleVibe: () => void;
};

export function useTopMenuHotkeys({
  searchVisible,
  onCloseHelp,
  onToggleHelp,
  onFocusSearch,
  onToggleMenu,
  onToggleControls,
  onToggleAllColumnControls,
  onToggleSearch,
  onToggleAddStream,
  onCycleTheme,
  onCycleVibe
}: UseTopMenuHotkeysArgs) {
  const latestRef = useRef<UseTopMenuHotkeysArgs>({
    searchVisible,
    onCloseHelp,
    onToggleHelp,
    onFocusSearch,
    onToggleMenu,
    onToggleControls,
    onToggleAllColumnControls,
    onToggleSearch,
    onToggleAddStream,
    onCycleTheme,
    onCycleVibe
  });

  useEffect(() => {
    latestRef.current = {
      searchVisible,
      onCloseHelp,
      onToggleHelp,
      onFocusSearch,
      onToggleMenu,
      onToggleControls,
      onToggleAllColumnControls,
      onToggleSearch,
      onToggleAddStream,
      onCycleTheme,
      onCycleVibe
    };
  }, [
    searchVisible,
    onCloseHelp,
    onToggleHelp,
    onFocusSearch,
    onToggleMenu,
    onToggleControls,
    onToggleAllColumnControls,
    onToggleSearch,
    onToggleAddStream,
    onCycleTheme,
    onCycleVibe
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const handlers = latestRef.current;

      if (e.key === 'Escape') {
        handlers.onCloseHelp();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const targetEl = e.target as HTMLElement | null;
      const typing = !!targetEl && (
        targetEl.tagName === 'INPUT'
        || targetEl.tagName === 'TEXTAREA'
        || targetEl.isContentEditable
      );
      if (typing) return;

      const key = String(e.key || '');
      const lower = key.toLowerCase();

      if (key === '?') {
        e.preventDefault();
        handlers.onToggleHelp();
        return;
      }
      if (key === '/') {
        e.preventDefault();
        if (!handlers.searchVisible) handlers.onToggleSearch();
        else handlers.onFocusSearch();
        return;
      }
      if (lower === 'h') {
        e.preventDefault();
        handlers.onToggleHelp();
        return;
      }
      if (lower === 'm') {
        e.preventDefault();
        handlers.onToggleMenu();
        return;
      }
      if (lower === 'c') {
        e.preventDefault();
        handlers.onToggleControls();
        return;
      }
      if (lower === 'g') {
        e.preventDefault();
        handlers.onToggleAllColumnControls();
        return;
      }
      if (lower === 's') {
        e.preventDefault();
        handlers.onToggleSearch();
        return;
      }
      if (lower === 'a') {
        e.preventDefault();
        handlers.onToggleAddStream();
        return;
      }
      if (lower === 't') {
        e.preventDefault();
        handlers.onCycleTheme();
        return;
      }
      if (lower === 'v') {
        e.preventDefault();
        handlers.onCycleVibe();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}
