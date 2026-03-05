'use client';

import { AddStreamSection } from './AddStreamSection';
import { SearchSection } from './SearchSection';
import { TopMenuControlsPanel } from './TopMenuControlsPanel';
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuDesktopSections() {
  const { showDesktopBody, searchVisible, addStreamVisible } = useTopMenuContext();

  if (!showDesktopBody) return null;

  return (
    <>
      {searchVisible ? <SearchSection /> : null}
      {addStreamVisible ? <AddStreamSection /> : null}
      <TopMenuControlsPanel />
    </>
  );
}
