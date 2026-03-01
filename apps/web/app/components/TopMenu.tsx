'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLanguage, setSearchQuery, setTopUiState, setHideAllResearch, setHideAllSummaries, setNotifySettings, setAiSettings, setMoodFilter, setTypeFilter, setAppearanceSettings, hydrateUiSettings, setHelpOpen, dismissToast, triggerShowMoreNewsAll, triggerResetNewsShownAll } from '../store/slices/uiSlice';
import { sendWsMessage } from '../store/wsClient';
import { reorderFeeds } from '../store/slices/feedsSlice';
import { AddStreamSection } from './top-menu/AddStreamSection';
import { HelpDialog } from './top-menu/HelpDialog';
import { SearchSection } from './top-menu/SearchSection';
import { TopMenuHeader } from './top-menu/TopMenuHeader';
import { TopMenuControlsPanel } from './top-menu/TopMenuControlsPanel';
import { TopMenuMobileDrawer } from './top-menu/TopMenuMobileDrawer';
import { ToastStack } from './top-menu/ToastStack';
import { useTopMenuHotkeys } from './top-menu/useTopMenuHotkeys';
import { useTopMenuActions } from './top-menu/useTopMenuActions';
import { type TopMenuDeleteAge, type TopMenuVibe } from './top-menu/topMenu.services';
import { TopMenuProvider } from './top-menu/context/TopMenuContext';
import { FILTERED_FEED_URL } from '../store/constants';

type SoundThemeValue = 'vibe' | TopMenuVibe;
type PersistedUiPrefs = Parameters<typeof hydrateUiSettings>[0];

const UI_PREFS_STORAGE_KEY = 'aiNews.uiPrefs.v2';

const SOUND_ROOT_FREQ: Record<TopMenuVibe, number> = {
  default: 330,
  anime: 512,
  arcade: 448,
  cinema: 296,
  newspaper: 264,
  cyberwitch: 388,
  fantasy: 352,
  scifi: 420
};

let sharedAudioContext: AudioContext | null = null;

function parsePersistedUiPrefs(raw: string): PersistedUiPrefs | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as PersistedUiPrefs;
  } catch {
    return null;
  }
}

function playSoundCue(theme: TopMenuVibe, kind: 'toggle' | 'success' | 'error') {
  if (typeof window === 'undefined') return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!sharedAudioContext) {
    sharedAudioContext = new AC();
  }
  const ctx = sharedAudioContext;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
  const root = SOUND_ROOT_FREQ[theme] ?? SOUND_ROOT_FREQ.default;
  const plan = kind === 'error'
    ? [0, -5, -10]
    : kind === 'success'
      ? [0, 4, 7]
      : [0, 2];
  const now = ctx.currentTime;
  plan.forEach((step, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === 'error' ? 'sawtooth' : 'triangle';
    osc.frequency.value = root * Math.pow(2, step / 12);
    gain.gain.setValueAtTime(0.0001, now + idx * 0.07);
    gain.gain.exponentialRampToValueAtTime(kind === 'toggle' ? 0.035 : 0.05, now + idx * 0.07 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + idx * 0.07);
    osc.stop(now + idx * 0.07 + 0.09);
  });
}

export default function TopMenu() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const ui = useAppSelector(s => s.ui);
  const connected = useAppSelector(s => s.connection.connected);
  const status = useAppSelector(s => s.connection.status);
  const totalTokens = useAppSelector(s => s.aiUsage.totalTokens);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const isMobile = useMediaQuery('(max-width: 900px)');
  const resolvedColorMode = ui.colorMode === 'system' ? (prefersDark ? 'dark' : 'light') : ui.colorMode;
  const feeds = useAppSelector(s => s.feeds.feeds);
  const orderByUrl = useAppSelector(s => s.feeds.orderByUrl);
  const [searchDraft, setSearchDraft] = useState(ui.searchQuery);
  const [feedType, setFeedType] = useState<'rss' | 'reddit' | 'youtube'>('rss');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedLabel, setFeedLabel] = useState('');
  const [feedInterval, setFeedInterval] = useState('120');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [deleteAgeAll, setDeleteAgeAll] = useState<TopMenuDeleteAge>('week');
  const [addStatus, setAddStatus] = useState<{ kind: 'info' | 'success' | 'error'; message: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const addStreamInputRef = useRef<HTMLInputElement | null>(null);
  const topbarInnerRef = useRef<HTMLDivElement | null>(null);
  const toastTimersRef = useRef<Record<string, number>>({});
  const seenToastIdsRef = useRef<Set<string>>(new Set());
  const searchDebounceTimerRef = useRef<number | null>(null);
  const focusTimerRef = useRef<number | null>(null);
  const toasts = useAppSelector(s => s.ui.toasts);
  const persistedUiPrefs = useMemo<PersistedUiPrefs>(() => ({
    language: ui.language,
    colorMode: ui.colorMode,
    menuCollapsed: ui.menuCollapsed,
    controlsCollapsed: ui.controlsCollapsed,
    searchVisible: ui.searchVisible,
    addStreamVisible: ui.addStreamVisible,
    allColumnControlsHidden: ui.allColumnControlsHidden,
    hideAllResearch: ui.hideAllResearch,
    hideAllSummaries: ui.hideAllSummaries,
    notifyEnabled: ui.notifyEnabled,
    notifyMode: ui.notifyMode,
    moodFilter: ui.moodFilter,
    typeFilter: ui.typeFilter,
    font: ui.font,
    fontSize: ui.fontSize,
    scheme: ui.scheme,
    performanceMode: ui.performanceMode,
    buttonMode: ui.buttonMode,
    menuHintMode: ui.menuHintMode,
    effectIntensity: ui.effectIntensity,
    soundEnabled: ui.soundEnabled,
    soundTheme: ui.soundTheme,
    vibe: ui.vibe
  }), [
    ui.addStreamVisible,
    ui.allColumnControlsHidden,
    ui.buttonMode,
    ui.colorMode,
    ui.controlsCollapsed,
    ui.effectIntensity,
    ui.font,
    ui.fontSize,
    ui.hideAllResearch,
    ui.hideAllSummaries,
    ui.language,
    ui.menuCollapsed,
    ui.menuHintMode,
    ui.moodFilter,
    ui.notifyEnabled,
    ui.notifyMode,
    ui.performanceMode,
    ui.scheme,
    ui.searchVisible,
    ui.soundEnabled,
    ui.soundTheme,
    ui.typeFilter,
    ui.vibe
  ]);
  const labels = useMemo(
    () => t('topMenu', { returnObjects: true }) as Record<string, string>,
    [t]
  );
  const resolvedSoundTheme: TopMenuVibe = ui.soundTheme === 'vibe' ? ui.vibe : ui.soundTheme;
  const triggerSoundCue = (kind: 'toggle' | 'success' | 'error') => {
    if (ui.performanceMode || !ui.soundEnabled) return;
    playSoundCue(resolvedSoundTheme, kind);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(UI_PREFS_STORAGE_KEY);
    if (!raw) return;
    const parsed = parsePersistedUiPrefs(raw);
    if (parsed) dispatch(hydrateUiSettings(parsed));
  }, [dispatch]);

  useEffect(() => {
    document.body.classList.toggle('menu-collapsed', ui.menuCollapsed);
    document.body.classList.toggle('controls-collapsed', ui.controlsCollapsed);
    document.body.dataset.vibe = ui.vibe;
    document.body.dataset.font = ui.font;
    document.body.dataset.fontSize = ui.fontSize;
    document.body.dataset.scheme = ui.scheme;
    document.body.dataset.performance = ui.performanceMode ? 'on' : 'off';
    document.body.dataset.effectIntensity = ui.effectIntensity;
    document.body.dataset.itemButtons = ui.buttonMode;
    document.body.dataset.theme = resolvedColorMode;
    document.documentElement.dataset.theme = resolvedColorMode;
    document.body.dataset.themeSource = ui.colorMode;
    document.documentElement.dataset.themeSource = ui.colorMode;
    document.documentElement.lang = ui.language;
  }, [resolvedColorMode, ui.buttonMode, ui.colorMode, ui.controlsCollapsed, ui.effectIntensity, ui.font, ui.fontSize, ui.language, ui.menuCollapsed, ui.performanceMode, ui.scheme, ui.vibe]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(persistedUiPrefs));
    } catch {}
  }, [persistedUiPrefs]);

  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current != null) {
        window.clearTimeout(searchDebounceTimerRef.current);
      }
      if (focusTimerRef.current != null) {
        window.clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  const scheduleFocus = (target: 'search' | 'addStream', delay = 30) => {
    if (focusTimerRef.current != null) {
      window.clearTimeout(focusTimerRef.current);
    }
    focusTimerRef.current = window.setTimeout(() => {
      if (target === 'search') {
        searchInputRef.current?.focus();
      } else {
        addStreamInputRef.current?.focus();
      }
    }, delay);
  };

  const onSearchDraftChange = (value: string) => {
    setSearchDraft(value);
    if (searchDebounceTimerRef.current != null) {
      window.clearTimeout(searchDebounceTimerRef.current);
    }
    searchDebounceTimerRef.current = window.setTimeout(() => {
      dispatch(setSearchQuery(value));
    }, 90);
  };

  useEffect(() => {
    if (!isMobile) setMobileDrawerOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (isMobile) return;
      if (ui.menuCollapsed || ui.controlsCollapsed) return;
      const root = topbarInnerRef.current;
      const target = event.target;
      if (!root || !target || !(target instanceof Node)) return;
      const elementTarget = target as HTMLElement;
      if (elementTarget.closest('.MuiMenu-root, .MuiPopover-root, .MuiModal-root, [role="listbox"], [role="option"], .MuiMenuItem-root')) {
        return;
      }
      if (!root.contains(target)) {
        dispatch(setTopUiState({ controlsCollapsed: true }));
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [dispatch, isMobile, ui.controlsCollapsed, ui.menuCollapsed]);

  useEffect(() => {
    const seen = seenToastIdsRef.current;
    toasts.forEach(t => {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        if (t.kind === 'error') triggerSoundCue('error');
        else if (t.kind === 'success') triggerSoundCue('success');
        else triggerSoundCue('toggle');
      }
      if (toastTimersRef.current[t.id]) return;
      toastTimersRef.current[t.id] = window.setTimeout(() => {
        dispatch(dismissToast(t.id));
        delete toastTimersRef.current[t.id];
      }, 5000);
    });
    const known = new Set(toasts.map(t => t.id));
    Object.keys(toastTimersRef.current).forEach(id => {
      if (known.has(id)) return;
      window.clearTimeout(toastTimersRef.current[id]);
      delete toastTimersRef.current[id];
    });
    Array.from(seen).forEach(id => {
      if (!known.has(id)) seen.delete(id);
    });
  }, [dispatch, toasts, resolvedSoundTheme, ui.performanceMode, ui.soundEnabled]);

  const clearSearch = () => {
    if (searchDebounceTimerRef.current != null) {
      window.clearTimeout(searchDebounceTimerRef.current);
    }
    setSearchDraft('');
    dispatch(setSearchQuery(''));
  };

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

  const searchLabel = ui.searchVisible ? labels.hideSearch : labels.search;
  const addStreamLabel = ui.addStreamVisible ? labels.hideAddStream : labels.addStream;
  const controlsLabel = ui.controlsCollapsed ? labels.showTopControls : labels.hideTopControls;
  const allColumnLabel = ui.allColumnControlsHidden ? labels.showAllColumnControls : labels.hideAllColumnControls;
  const menuLabel = ui.menuCollapsed ? labels.showMenu : labels.hideMenu;
  const menuItemsAsIcons = ui.buttonMode === 'icons';
  const showDesktopBody = !isMobile && !ui.menuCollapsed;
  const orderedFeeds = useMemo(() => {
    const list = [...feeds];
    const orderIndex = new Map(orderByUrl.map((url, idx) => [url, idx]));
    list.sort((a, b) => {
      const aFiltered = a.url === FILTERED_FEED_URL;
      const bFiltered = b.url === FILTERED_FEED_URL;
      if (aFiltered !== bFiltered) return aFiltered ? -1 : 1;
      const ai = orderIndex.get(a.url) ?? Number.MAX_SAFE_INTEGER;
      const bi = orderIndex.get(b.url) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
    return list;
  }, [feeds, orderByUrl]);

  const topHintAsButtons = ui.menuHintMode === 'buttons';
  const onOpenHelp = () => dispatch(setHelpOpen(true));
  const onToggleHideAllResearch = () => dispatch(setHideAllResearch(!ui.hideAllResearch));
  const onToggleHideAllSummaries = () => dispatch(setHideAllSummaries(!ui.hideAllSummaries));
  const onChangeVibe = (nextVibe: TopMenuVibe) => dispatch(setAppearanceSettings({ vibe: nextVibe }));
  const onPlayToggleSound = () => triggerSoundCue('toggle');
  const onReorderFeeds = (fromUrl: string, toUrl: string) => dispatch(reorderFeeds({ fromUrl, toUrl }));

  const scrollToColumns = () => {
    document.querySelector('.container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  const onToggleAiEnabled = (enabled: boolean) => {
    const ok = sendWsMessage({ type: 'toggle_ai', enabled });
    if (ok) dispatch(setAiSettings({ aiEnabled: enabled }));
  };

  const onNotifyEnabledChange = async (enabled: boolean) => {
    dispatch(setNotifySettings({ notifyEnabled: enabled }));
    await requestNotificationPermission(enabled);
  };

  const onSummaryLangChange = (lang: 'bilingual' | 'bg' | 'en') => {
    const ok = sendWsMessage({ type: 'set_summary_lang', lang });
    if (ok) dispatch(setAiSettings({ summaryLang: lang }));
  };

  const onResearchLangChange = (lang: 'bg' | 'en') => {
    const ok = sendWsMessage({ type: 'set_research_lang', lang });
    if (ok) dispatch(setAiSettings({ researchLang: lang }));
  };

  const controlsPanel = (
    <TopMenuControlsPanel
      ui={ui}
      labels={labels}
      deleteAgeAll={deleteAgeAll}
      onDeleteAgeAllChange={setDeleteAgeAll}
      onResetAllNewest={resetAllNewest}
      onShowMoreNewsAll={() => dispatch(triggerShowMoreNewsAll())}
      onResetNewsShownAll={() => dispatch(triggerResetNewsShownAll())}
      onDeleteOldAllColumns={deleteOldAllColumns}
      onToggleAiEnabled={onToggleAiEnabled}
      onOpenHelp={onOpenHelp}
      onNotifyEnabledChange={onNotifyEnabledChange}
      onNotifyModeChange={notifyMode => dispatch(setNotifySettings({ notifyMode }))}
      onChangeAiProvider={changeAiProvider}
      onSummaryLangChange={onSummaryLangChange}
      onResearchLangChange={onResearchLangChange}
      onMoodFilterChange={value => dispatch(setMoodFilter(value))}
      onTypeFilterChange={value => dispatch(setTypeFilter(value))}
      onApplyAllBudget={applyAllBudget}
      onSetAppearance={patch => dispatch(setAppearanceSettings(patch))}
      onSetLanguage={lang => dispatch(setLanguage(lang))}
      onCycleTheme={cycleTheme}
      onTogglePerformanceMode={() => dispatch(setAppearanceSettings({ performanceMode: !ui.performanceMode }))}
      onToggleSoundEnabled={() => {
        const next = !ui.soundEnabled;
        dispatch(setAppearanceSettings({ soundEnabled: next }));
        if (next) triggerSoundCue('success');
      }}
    />
  );

  const topMenuContextValue = useMemo(() => ({
    labels,
    topHintAsButtons,
    isMobile,
    connected,
    status,
    totalTokens,
    menuItemsAsIcons,
    vibe: ui.vibe,
    searchLabel,
    addStreamLabel,
    controlsLabel,
    allColumnLabel,
    menuLabel,
    hideAllResearchLabel: ui.hideAllResearch ? labels.showAllResearch : labels.hideAllResearch,
    hideAllSummariesLabel: ui.hideAllSummaries ? labels.showAllSummaries : labels.hideAllSummaries,
    orderedFeeds,
    searchVisible: ui.searchVisible,
    addStreamVisible: ui.addStreamVisible,
    onScrollToColumns: scrollToColumns,
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
  }), [
    addStreamLabel,
    allColumnLabel,
    connected,
    controlsLabel,
    isMobile,
    labels,
    menuItemsAsIcons,
    menuLabel,
    onChangeVibe,
    onOpenHelp,
    onPlayToggleSound,
    onReorderFeeds,
    onToggleHideAllResearch,
    onToggleHideAllSummaries,
    orderedFeeds,
    searchLabel,
    status,
    toggleAddStream,
    toggleAllColumnControls,
    toggleControls,
    toggleMenu,
    toggleSearch,
    topHintAsButtons,
    totalTokens,
    scrollToColumns,
    ui.addStreamVisible,
    ui.hideAllResearch,
    ui.hideAllSummaries,
    ui.searchVisible,
    ui.vibe
  ]);

  return (
    <TopMenuProvider value={topMenuContextValue}>
      <div className="topbar">
      <div className="topbarInner" id="topbarInner" ref={topbarInnerRef}>
        <TopMenuHeader />

        {showDesktopBody && ui.searchVisible ? searchSection : null}
        {showDesktopBody && ui.addStreamVisible ? addStreamSection : null}
        {showDesktopBody ? controlsPanel : null}
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
