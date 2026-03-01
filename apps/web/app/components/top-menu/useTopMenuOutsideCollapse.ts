'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

type UseTopMenuOutsideCollapseArgs = {
  isMobile: boolean;
  menuCollapsed: boolean;
  controlsCollapsed: boolean;
  topbarInnerRef: RefObject<HTMLDivElement | null>;
  onCollapseControls: () => void;
};

export function useTopMenuOutsideCollapse({
  isMobile,
  menuCollapsed,
  controlsCollapsed,
  topbarInnerRef,
  onCollapseControls
}: UseTopMenuOutsideCollapseArgs) {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (isMobile) return;
      if (menuCollapsed || controlsCollapsed) return;
      const root = topbarInnerRef.current;
      const target = event.target;
      if (!root || !target || !(target instanceof Node)) return;
      const elementTarget = target as HTMLElement;
      if (elementTarget.closest('.MuiMenu-root, .MuiPopover-root, .MuiModal-root, [role="listbox"], [role="option"], .MuiMenuItem-root')) {
        return;
      }
      if (!root.contains(target)) {
        onCollapseControls();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [controlsCollapsed, isMobile, menuCollapsed, onCollapseControls, topbarInnerRef]);
}

