'use client';

import { HelpDialog } from './top-menu/HelpDialog';
import { TopMenuHeader } from './top-menu/TopMenuHeader';
import { TopMenuMobileDrawer } from './top-menu/TopMenuMobileDrawer';
import { TopMenuDesktopSections } from './top-menu/TopMenuDesktopSections';
import { ToastStack } from './top-menu/ToastStack';
import { TopMenuProvider } from './top-menu/context/TopMenuProvider';
import { useTopMenuController } from './top-menu/useTopMenuController';

export default function TopMenu() {
  const {
    isMobile,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    topbarInnerRef,
    contextValue
  } = useTopMenuController();

  return (
    <TopMenuProvider value={contextValue}>
      <div className="topbar">
        <div className="topbarInner" id="topbarInner" ref={topbarInnerRef}>
          <TopMenuHeader />

          <TopMenuDesktopSections />
        </div>

        {isMobile ? (
          <TopMenuMobileDrawer
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
          />
        ) : null}

        <HelpDialog />
        <ToastStack />
      </div>
    </TopMenuProvider>
  );
}
