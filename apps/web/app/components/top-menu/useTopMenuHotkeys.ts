'use client';

import { useEffect } from 'react';

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
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseHelp();
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
        onToggleHelp();
        return;
      }
      if (key === '/') {
        e.preventDefault();
        if (!searchVisible) onToggleSearch();
        else onFocusSearch();
        return;
      }
      if (lower === 'h') {
        e.preventDefault();
        onToggleHelp();
        return;
      }
      if (lower === 'm') {
        e.preventDefault();
        onToggleMenu();
        return;
      }
      if (lower === 'c') {
        e.preventDefault();
        onToggleControls();
        return;
      }
      if (lower === 'g') {
        e.preventDefault();
        onToggleAllColumnControls();
        return;
      }
      if (lower === 's') {
        e.preventDefault();
        onToggleSearch();
        return;
      }
      if (lower === 'a') {
        e.preventDefault();
        onToggleAddStream();
        return;
      }
      if (lower === 't') {
        e.preventDefault();
        onCycleTheme();
        return;
      }
      if (lower === 'v') {
        e.preventDefault();
        onCycleVibe();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    onCloseHelp,
    onToggleHelp,
    onFocusSearch,
    onToggleMenu,
    onToggleControls,
    onToggleAllColumnControls,
    onToggleSearch,
    onToggleAddStream,
    onCycleTheme,
    onCycleVibe,
    searchVisible
  ]);
}
