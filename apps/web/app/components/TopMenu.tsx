'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  dismissToast,
  setAppearanceSettings,
  setHelpOpen,
  setHideAllResearch,
  setHideAllSummaries,
  setSearchQuery,
  setTopUiState
} from '../store/slices/uiSlice';
import { reorderFeeds } from '../store/slices/feedsSlice';
import { AddStreamSection } from './top-menu/AddStreamSection';
import { HelpDialog } from './top-menu/HelpDialog';
import { SearchSection } from './top-menu/SearchSection';
import { TopMenuControlsPanel } from './top-menu/TopMenuControlsPanel';
import { TopMenuHeader } from './top-menu/TopMenuHeader';
import { TopMenuMobileDrawer } from './top-menu/TopMenuMobileDrawer';
import { TopMenuDesktopSections } from './top-menu/TopMenuDesktopSections';
import { ToastStack } from './top-menu/ToastStack';
import { TopMenuProvider } from './top-menu/context/TopMenuProvider';
import { type TopMenuDeleteAge, type TopMenuVibe } from './top-menu/topMenu.services';
import { useTopMenuActions } from './top-menu/useTopMenuActions';
import { useTopMenuFocusAndSearch } from './top-menu/useTopMenuFocusAndSearch';
import { useTopMenuHotkeys } from './top-menu/useTopMenuHotkeys';
import { useTopMenuOutsideCollapse } from './top-menu/useTopMenuOutsideCollapse';
import { useTopMenuSound } from './top-menu/useTopMenuSound';
import { useTopMenuToastLifecycle } from './top-menu/useTopMenuToastLifecycle';
import { useTopMenuUiPersistence } from './top-menu/useTopMenuUiPersistence';
import { useTopMenuViewModel } from './top-menu/useTopMenuViewModel';
import { useTopMenuControlPanelHandlers } from './top-menu/useTopMenuControlPanelHandlers';
import type { AddStatus, FeedType } from './top-menu/types';

export default function TopMenu() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const ui = useAppSelector(s => s.ui);
  const connected = useAppSelector(s => s.connection.connected);
  const status = useAppSelector(s => s.connection.status);
  const totalTokens = useAppSelector(s => s.aiUsage.totalTokens);
  const feeds = useAppSelector(s => s.feeds.feeds);
  const orderByUrl = useAppSelector(s => s.feeds.orderByUrl);
  const toasts = useAppSelector(s => s.ui.toasts);

  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const isMobile = useMediaQuery('(max-width: 900px)');
  const resolvedColorMode = ui.colorMode === 'system' ? (prefersDark ? 'dark' : 'light') : ui.colorMode;

  const [feedType, setFeedType] = useState<FeedType>('rss');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedLabel, setFeedLabel] = useState('');
  const [feedInterval, setFeedInterval] = useState('120');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [deleteAgeAll, setDeleteAgeAll] = useState<TopMenuDeleteAge>('week');
  const [addStatus, setAddStatus] = useState<AddStatus>(null);
  const topbarInnerRef = useRef<HTMLDivElement | null>(null);

  const labels = useMemo(
    () => t('topMenu', { returnObjects: true }) as Record<string, string>,
    [t]
  );

  useTopMenuUiPersistence({ dispatch, ui, resolvedColorMode });

  const { triggerSoundCue } = useTopMenuSound(ui);
  const {
    searchDraft,
    searchInputRef,
    addStreamInputRef,
    scheduleFocus,
    onSearchDraftChange,
    clearSearch
  } = useTopMenuFocusAndSearch({
    initialSearchQuery: ui.searchQuery,
    onSearchCommit: value => dispatch(setSearchQuery(value))
  });

  useEffect(() => {
    if (!isMobile) setMobileDrawerOpen(false);
  }, [isMobile]);

  useTopMenuOutsideCollapse({
    isMobile,
    menuCollapsed: ui.menuCollapsed,
    controlsCollapsed: ui.controlsCollapsed,
    topbarInnerRef,
    onCollapseControls: () => dispatch(setTopUiState({ controlsCollapsed: true }))
  });

  useTopMenuToastLifecycle({
    toasts,
    onDismiss: id => dispatch(dismissToast(id)),
    onToastKind: kind => {
      if (kind === 'error') triggerSoundCue('error');
      else if (kind === 'success') triggerSoundCue('success');
      else triggerSoundCue('toggle');
    }
  });

  const {
    addStream,
    toggleSearch,
    toggleAddStream,
    toggleControls,
    toggleMenu,
    toggleAllColumnControls,
    cycleTheme,
    cycleVibe,
    applyAllBudget,
    changeAiProvider,
    requestNotificationPermission,
    resetAllNewest,
    deleteOldAllColumns
  } = useTopMenuActions({
    dispatch,
    ui,
    feeds,
    isMobile,
    labels,
    t,
    feedType,
    feedUrl,
    feedLabel,
    feedInterval,
    deleteAgeAll,
    setAddStatus,
    setFeedUrl,
    setFeedLabel,
    setMobileDrawerOpen,
    scheduleFocus
  });

  useTopMenuHotkeys({
    searchVisible: ui.searchVisible,
    onCloseHelp: () => dispatch(setHelpOpen(false)),
    onToggleHelp: () => dispatch(setHelpOpen(!ui.helpOpen)),
    onFocusSearch: () => scheduleFocus('search', 20),
    onToggleMenu: toggleMenu,
    onToggleControls: toggleControls,
    onToggleAllColumnControls: toggleAllColumnControls,
    onToggleSearch: toggleSearch,
    onToggleAddStream: toggleAddStream,
    onCycleTheme: cycleTheme,
    onCycleVibe: cycleVibe
  });

  const onOpenHelp = () => dispatch(setHelpOpen(true));
  const onToggleHideAllResearch = () => dispatch(setHideAllResearch(!ui.hideAllResearch));
  const onToggleHideAllSummaries = () => dispatch(setHideAllSummaries(!ui.hideAllSummaries));
  const onChangeVibe = (nextVibe: TopMenuVibe) => dispatch(setAppearanceSettings({ vibe: nextVibe }));
  const onReorderFeeds = (fromUrl: string, toUrl: string) => dispatch(reorderFeeds({ fromUrl, toUrl }));
  const onPlayToggleSound = () => triggerSoundCue('toggle');
  const controlPanelHandlers = useTopMenuControlPanelHandlers({
    dispatch,
    ui,
    triggerSoundCue,
    requestNotificationPermission,
    changeAiProvider,
    applyAllBudget,
    cycleTheme,
    resetAllNewest,
    deleteOldAllColumns,
    onOpenHelp
  });

  const onScrollToColumns = () => {
    document.querySelector('.container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const topHintAsButtons = ui.menuHintMode === 'buttons';
  const menuItemsAsIcons = ui.buttonMode === 'icons';
  const showDesktopBody = !isMobile && !ui.menuCollapsed;

  const { contextValue } = useTopMenuViewModel({
    labels,
    topHintAsButtons,
    isMobile,
    connected,
    status,
    totalTokens,
    language: ui.language,
    timezone: ui.timezone,
    menuItemsAsIcons,
    vibe: ui.vibe,
    hideAllResearch: ui.hideAllResearch,
    hideAllSummaries: ui.hideAllSummaries,
    searchVisible: ui.searchVisible,
    addStreamVisible: ui.addStreamVisible,
    controlsCollapsed: ui.controlsCollapsed,
    menuCollapsed: ui.menuCollapsed,
    allColumnControlsHidden: ui.allColumnControlsHidden,
    feeds,
    orderByUrl,
    onScrollToColumns,
    onOpenHelp,
    onToggleMenu: toggleMenu,
    onToggleSearch: toggleSearch,
    onToggleAddStream: toggleAddStream,
    onToggleControls: toggleControls,
    onToggleAllColumnControls: toggleAllColumnControls,
    onToggleHideAllResearch,
    onToggleHideAllSummaries,
    onChangeVibe,
    onPlayToggleSound,
    onReorderFeeds
  });

  const searchSection = (
    <SearchSection
      isMobile={isMobile}
      searchDraft={searchDraft}
      onSearchDraftChange={onSearchDraftChange}
      onClear={clearSearch}
      searchInputRef={searchInputRef}
      labels={labels}
    />
  );

  const addStreamSection = (
    <AddStreamSection
      isMobile={isMobile}
      feedType={feedType}
      feedUrl={feedUrl}
      feedLabel={feedLabel}
      feedInterval={feedInterval}
      addStatus={addStatus}
      addStreamInputRef={addStreamInputRef}
      labels={labels}
      onFeedTypeChange={setFeedType}
      onFeedUrlChange={setFeedUrl}
      onFeedLabelChange={setFeedLabel}
      onFeedIntervalChange={setFeedInterval}
      onAddStream={addStream}
    />
  );

  const controlsPanel = (
    <TopMenuControlsPanel
      ui={ui}
      labels={labels}
      deleteAgeAll={deleteAgeAll}
      onDeleteAgeAllChange={setDeleteAgeAll}
      onResetAllNewest={controlPanelHandlers.onResetAllNewest}
      onShowMoreNewsAll={controlPanelHandlers.onShowMoreNewsAll}
      onResetNewsShownAll={controlPanelHandlers.onResetNewsShownAll}
      onDeleteOldAllColumns={controlPanelHandlers.onDeleteOldAllColumns}
      onToggleAiEnabled={controlPanelHandlers.onToggleAiEnabled}
      onOpenHelp={controlPanelHandlers.onOpenHelp}
      onNotifyEnabledChange={controlPanelHandlers.onNotifyEnabledChange}
      onNotifyModeChange={controlPanelHandlers.onNotifyModeChange}
      onChangeAiProvider={controlPanelHandlers.onChangeAiProvider}
      onSummaryLangChange={controlPanelHandlers.onSummaryLangChange}
      onResearchLangChange={controlPanelHandlers.onResearchLangChange}
      onMoodFilterChange={controlPanelHandlers.onMoodFilterChange}
      onTypeFilterChange={controlPanelHandlers.onTypeFilterChange}
      onApplyAllBudget={controlPanelHandlers.onApplyAllBudget}
      onSetAppearance={controlPanelHandlers.onSetAppearance}
      onSetLanguage={controlPanelHandlers.onSetLanguage}
      onCycleTheme={controlPanelHandlers.onCycleTheme}
      onTogglePerformanceMode={controlPanelHandlers.onTogglePerformanceMode}
      onToggleSoundEnabled={controlPanelHandlers.onToggleSoundEnabled}
    />
  );

  return (
    <TopMenuProvider value={contextValue}>
      <div className="topbar">
        <div className="topbarInner" id="topbarInner" ref={topbarInnerRef}>
          <TopMenuHeader />

          <TopMenuDesktopSections
            showDesktopBody={showDesktopBody}
            searchVisible={ui.searchVisible}
            addStreamVisible={ui.addStreamVisible}
            searchSection={searchSection}
            addStreamSection={addStreamSection}
            controlsPanel={controlsPanel}
          />
        </div>

        {isMobile ? (
          <TopMenuMobileDrawer
            open={mobileDrawerOpen}
            searchSection={searchSection}
            addStreamSection={addStreamSection}
            controlsPanel={controlsPanel}
            onClose={() => setMobileDrawerOpen(false)}
          />
        ) : null}

        <HelpDialog
          open={ui.helpOpen}
          title={labels.helpTitle}
          closeLabel={labels.close}
          onClose={() => dispatch(setHelpOpen(false))}
        />
        <ToastStack toasts={toasts} onDismiss={id => dispatch(dismissToast(id))} />
      </div>
    </TopMenuProvider>
  );
}
