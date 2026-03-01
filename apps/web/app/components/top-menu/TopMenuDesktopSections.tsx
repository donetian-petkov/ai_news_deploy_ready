'use client';

import type { ReactNode } from 'react';

type Props = {
  showDesktopBody: boolean;
  searchVisible: boolean;
  addStreamVisible: boolean;
  searchSection: ReactNode;
  addStreamSection: ReactNode;
  controlsPanel: ReactNode;
};

export function TopMenuDesktopSections({
  showDesktopBody,
  searchVisible,
  addStreamVisible,
  searchSection,
  addStreamSection,
  controlsPanel
}: Props) {
  if (!showDesktopBody) return null;

  return (
    <>
      {searchVisible ? searchSection : null}
      {addStreamVisible ? addStreamSection : null}
      {controlsPanel}
    </>
  );
}
