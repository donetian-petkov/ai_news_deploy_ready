'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Box, Button, Divider, Drawer, FormControl, IconButton, MenuItem, Select, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import GridViewIcon from '@mui/icons-material/GridView';
import MenuIcon from '@mui/icons-material/Menu';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import SearchIcon from '@mui/icons-material/Search';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLanguage, setSearchQuery, setTopUiState, setHideAllResearch, setHideAllSummaries, setNotifySettings, setAiSettings, setMoodFilter, setTypeFilter, setAppearanceSettings, hydrateUiSettings, setHelpOpen, dismissToast, triggerShowMoreNewsAll, triggerResetNewsShownAll } from '../store/slices/uiSlice';
import { sendWsMessage } from '../store/wsClient';
import { reorderFeeds } from '../store/slices/feedsSlice';
import { AddStreamSection } from './top-menu/AddStreamSection';
import { HelpDialog } from './top-menu/HelpDialog';
import { QuickVibeSelect } from './top-menu/QuickVibeSelect';
import { SearchSection } from './top-menu/SearchSection';
import { StatusPills } from './top-menu/StatusPills';
import { ToastStack } from './top-menu/ToastStack';
import { useTopMenuHotkeys } from './top-menu/useTopMenuHotkeys';
import { useTopMenuActions } from './top-menu/useTopMenuActions';
import { type TopMenuDeleteAge, type TopMenuVibe } from './top-menu/topMenu.services';
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

  const controlsPanel = (
    <div className="controls" style={ui.controlsCollapsed ? { display: 'none' } : undefined}>
      <div className="controlsCompactRow controlsRow">
        <div className="controlGroup">
          <button id="resetBtn" className="btn" type="button" onClick={resetAllNewest}>{labels.resetAllToNewestTen}</button>
          <button id="showMoreNewsAllBtn" className="btn" type="button" onClick={() => dispatch(triggerShowMoreNewsAll())}>
            {labels.showMoreNewsAll}
          </button>
          <button id="resetNewsShownAllBtn" className="btn" type="button" onClick={() => dispatch(triggerResetNewsShownAll())}>
            {labels.resetNewsShownAll}
          </button>
          <label className="checkbox" title="Delete old news by age from all columns">
            <span id="deleteAgePrefix">{labels.deleteAgePrefix}</span>
            <select id="deleteAgeSelect" className="select" value={deleteAgeAll} onChange={e => setDeleteAgeAll(e.target.value as TopMenuDeleteAge)}>
              <option value="yesterday">{labels.ageYesterday}</option>
              <option value="week">{labels.agePastWeek}</option>
              <option value="month">{labels.agePastMonth}</option>
              <option value="year">{labels.agePastYear}</option>
            </select>
          </label>
          <button id="deleteAgeAllBtn" className="btn danger" type="button" onClick={deleteOldAllColumns}>{labels.deleteOldAllColumns}</button>
          <label className="checkbox" title="Embeddings matching, AI dedupe, summaries, research">
            {ui.aiAvailable ? (
              <>
                <input
                  id="aiEnabled"
                  type="checkbox"
                  checked={ui.aiEnabled}
                  disabled={!ui.aiAvailable}
                  onChange={e => {
                    const enabled = e.target.checked;
                    const ok = sendWsMessage({ type: 'toggle_ai', enabled });
                    if (ok) dispatch(setAiSettings({ aiEnabled: enabled }));
                  }}
                />
                <span id="aiEnabledLabel">{labels.aiEnabledLabel}</span>
              </>
            ) : (
              <span id="aiUnavailableLabel">{labels.aiUnavailable}</span>
            )}
          </label>
          <button id="helpBtn" className="btn" type="button" onClick={() => dispatch(setHelpOpen(true))}>{labels.helpTitle}</button>
        </div>
      </div>
      <div className="controlsHint" id="controlsHint">
        {labels.controlsHint}
      </div>

      <div className="controlsGrid">
        <details className="controlSection" open>
          <summary id="notificationsSummary">{labels.notificationsSummary}</summary>
          <div className="controlGroup">
            <label className="checkbox">
              <input
                id="notifyEnabled"
                type="checkbox"
                checked={ui.notifyEnabled}
                onChange={async e => {
                  const enabled = e.target.checked;
                  dispatch(setNotifySettings({ notifyEnabled: enabled }));
                  await requestNotificationPermission(enabled);
                }}
              />
              <span id="notifyEnabledLabel">{labels.notifyEnabledLabel}</span>
            </label>
            <label className="checkbox">
              <span id="notifyPrefix">{labels.notifyPrefix}</span>
              <select
                id="notifyMode"
                className="select"
                value={ui.notifyMode}
                onChange={e => dispatch(setNotifySettings({ notifyMode: e.target.value as 'matched' | 'matched_pinned' | 'pinned' | 'all' }))}
              >
                <option value="matched">{labels.notifyOnlyMatched}</option>
                <option value="matched_pinned">{labels.notifyMatchedPinned}</option>
                <option value="pinned">{labels.notifyOnlyPinned}</option>
                <option value="all">{labels.notifyAllColumns}</option>
              </select>
            </label>
          </div>
        </details>

        <details className="controlSection" open>
          <summary id="aiSettingsSummary">{labels.aiSettingsSummary}</summary>
          <div className="controlGroup">
            <label className="checkbox">
              <span id="aiProviderPrefix">{labels.aiProvider}</span>
              <select
                id="aiProviderSelect"
                className="select"
                value={ui.aiProvider}
                onChange={e => changeAiProvider(e.target.value as 'openai' | 'claude' | 'openrouter')}
              >
                <option value="openai">{labels.openai}</option>
                <option value="claude">{labels.claude}</option>
                <option value="openrouter">{labels.openrouter}</option>
              </select>
            </label>
            <label className="checkbox">
              <span id="summaryLangPrefix">{labels.summaryPrefix}</span>
              <select
                id="summaryLang"
                className="select"
                value={ui.summaryLang}
                disabled={!ui.aiAvailable}
                onChange={e => {
                  const lang = e.target.value as 'bilingual' | 'bg' | 'en';
                  const ok = sendWsMessage({ type: 'set_summary_lang', lang });
                  if (ok) dispatch(setAiSettings({ summaryLang: lang }));
                }}
              >
                <option value="bilingual">BG / EN</option>
                <option value="bg">BG</option>
                <option value="en">EN</option>
              </select>
            </label>
            <label className="checkbox">
              <span id="researchLangPrefix">{labels.researchPrefix}</span>
              <select
                id="researchLang"
                className="select"
                value={ui.researchLang}
                disabled={!ui.aiAvailable}
                onChange={e => {
                  const lang = e.target.value as 'bg' | 'en';
                  const ok = sendWsMessage({ type: 'set_research_lang', lang });
                  if (ok) dispatch(setAiSettings({ researchLang: lang }));
                }}
              >
                <option value="bg">BG</option>
                <option value="en">EN</option>
              </select>
            </label>
            {!ui.performanceMode ? (
              <>
                <label className="checkbox">
                  <span id="moodFilterPrefix">{labels.moodFilter}</span>
                  <select
                    id="moodFilter"
                    className="select"
                    value={ui.moodFilter}
                    disabled={!ui.aiAvailable}
                    onChange={e => dispatch(setMoodFilter(e.target.value as 'all' | 'pesimistic' | 'optimistic' | 'realistic' | 'melancholy' | 'happiness' | 'sadness' | 'rage' | 'uncertainty' | 'neutral' | 'curios'))}
                  >
                    <option value="all">{labels.moodAll}</option>
                    <option value="pesimistic">{labels.moodPesimistic}</option>
                    <option value="optimistic">{labels.moodOptimistic}</option>
                    <option value="realistic">{labels.moodRealistic}</option>
                    <option value="melancholy">{labels.moodMelancholy}</option>
                    <option value="happiness">{labels.moodHappiness}</option>
                    <option value="sadness">{labels.moodSadness}</option>
                    <option value="rage">{labels.moodRage}</option>
                    <option value="uncertainty">{labels.moodUncertainty}</option>
                    <option value="neutral">{labels.moodNeutral}</option>
                    <option value="curios">{labels.moodCurios}</option>
                  </select>
                </label>
                <label className="checkbox">
                  <span id="typeFilterPrefix">{labels.typeFilter}</span>
                  <select
                    id="typeFilter"
                    className="select"
                    value={ui.typeFilter}
                    disabled={!ui.aiAvailable}
                    onChange={e => dispatch(setTypeFilter(e.target.value as 'all' | 'science' | 'movies' | 'politics' | 'business' | 'technology' | 'sports' | 'health' | 'world' | 'culture' | 'environment' | 'crime' | 'education' | 'other'))}
                  >
                    <option value="all">{labels.typeAll}</option>
                    <option value="science">{labels.typeScience}</option>
                    <option value="movies">{labels.typeMovies}</option>
                    <option value="politics">{labels.typePolitics}</option>
                    <option value="business">{labels.typeBusiness}</option>
                    <option value="technology">{labels.typeTechnology}</option>
                    <option value="sports">{labels.typeSports}</option>
                    <option value="health">{labels.typeHealth}</option>
                    <option value="world">{labels.typeWorld}</option>
                    <option value="culture">{labels.typeCulture}</option>
                    <option value="environment">{labels.typeEnvironment}</option>
                    <option value="crime">{labels.typeCrime}</option>
                    <option value="education">{labels.typeEducation}</option>
                    <option value="other">{labels.typeOther}</option>
                  </select>
                </label>
              </>
            ) : (
              <Alert severity="info" sx={{ py: 0 }}>
                {labels.perfAIFiltersHidden}
              </Alert>
            )}
            <label className="checkbox" title="Apply one budget to all columns">
              <span id="allBudgetPrefix">{labels.allBudgetPrefix}</span>
              <select
                id="allBudgetSelect"
                className="select"
                value={ui.allBudget}
                disabled={!ui.aiAvailable}
                onChange={e => {
                  const budget = e.target.value as 'mixed' | 'low' | 'standard' | 'high';
                  if (budget !== 'mixed') applyAllBudget(budget);
                }}
              >
                <option value="mixed">{labels.budgetMixed}</option>
                <option value="low">{labels.budgetLow}</option>
                <option value="standard">{labels.budgetStandard}</option>
                <option value="high">{labels.budgetHigh}</option>
              </select>
            </label>
            {!ui.aiAvailable ? (
              <Alert severity="info" sx={{ py: 0 }}>
                {labels.aiUnavailable}
              </Alert>
            ) : null}
          </div>
        </details>

        <details className="controlSection" open>
          <summary id="appearanceSummary">{labels.appearanceSummary}</summary>
          <div className="controlGroup" id="appearanceGroup">
            <label className="checkbox" title="Change UI font">
              <span id="fontPrefix">{labels.fontPrefix}</span>
              <select
                id="fontSelect"
                className="select"
                value={ui.font}
                onChange={e => dispatch(setAppearanceSettings({ font: e.target.value as 'system' | 'manrope' | 'grotesk' | 'sora' | 'plex' | 'serif' | 'mono' }))}
              >
                <option value="system">{labels.fontSystem}</option>
                <option value="manrope">{labels.fontManrope}</option>
                <option value="grotesk">{labels.fontGrotesk}</option>
                <option value="sora">{labels.fontSora}</option>
                <option value="plex">{labels.fontPlex}</option>
                <option value="serif">{labels.fontSerif}</option>
                <option value="mono">{labels.fontMono}</option>
              </select>
            </label>
            <label className="checkbox" title="Scale text size">
              <span id="fontSizePrefix">{labels.fontSizePrefix}</span>
              <select
                id="fontSizeSelect"
                className="select"
                value={ui.fontSize}
                onChange={e => dispatch(setAppearanceSettings({ fontSize: e.target.value as 'sm' | 'md' | 'lg' | 'xl' }))}
              >
                <option value="sm">{labels.fontSizeSmall}</option>
                <option value="md">{labels.fontSizeMedium}</option>
                <option value="lg">{labels.fontSizeLarge}</option>
                <option value="xl">{labels.fontSizeXL}</option>
              </select>
            </label>
            <label className="checkbox" title="Column accent scheme">
              <span id="schemePrefix">{labels.schemePrefix}</span>
              <select
                id="schemeSelect"
                className="select"
                value={ui.scheme}
                onChange={e => dispatch(setAppearanceSettings({ scheme: e.target.value as 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest' }))}
              >
                <option value="classic">{labels.schemeClassic}</option>
                <option value="vivid">{labels.schemeVivid}</option>
                <option value="sunset">{labels.schemeSunset}</option>
                <option value="neon">{labels.schemeNeon}</option>
                <option value="ocean">{labels.schemeOcean}</option>
                <option value="forest">{labels.schemeForest}</option>
              </select>
            </label>
            <label className="checkbox" title="Item buttons look">
              <span id="buttonsPrefix">{labels.buttonsPrefix}</span>
              <select
                id="btnModeSelect"
                className="select"
                value={ui.buttonMode}
                onChange={e => dispatch(setAppearanceSettings({ buttonMode: e.target.value as 'icons' | 'text' }))}
              >
                <option value="icons">{labels.buttonsIcons}</option>
                <option value="text">{labels.buttonsText}</option>
              </select>
            </label>
            <label className="checkbox" title="Top menu hint style">
              <span id="menuHintsPrefix">{labels.menuHints}</span>
              <select
                id="menuHintsSelect"
                className="select"
                value={ui.menuHintMode}
                onChange={e => dispatch(setAppearanceSettings({ menuHintMode: e.target.value as 'text' | 'buttons' }))}
              >
                <option value="text">{labels.menuHintsText}</option>
                <option value="buttons">{labels.menuHintsButtons}</option>
              </select>
            </label>
            <label className="checkbox" title="Visual ornament intensity">
              <span id="effectIntensityPrefix">{labels.effectIntensity}</span>
              <select
                id="effectIntensitySelect"
                className="select"
                value={ui.effectIntensity}
                disabled={ui.performanceMode}
                onChange={e => dispatch(setAppearanceSettings({ effectIntensity: e.target.value as 'low' | 'medium' | 'high' }))}
              >
                <option value="low">{labels.effectLow}</option>
                <option value="medium">{labels.effectMedium}</option>
                <option value="high">{labels.effectHigh}</option>
              </select>
            </label>
            <label className="checkbox" title="Audio vibe profile">
              <span id="soundThemePrefix">{labels.soundTheme}</span>
              <select
                id="soundThemeSelect"
                className="select"
                value={ui.soundTheme}
                disabled={ui.performanceMode}
                onChange={e => dispatch(setAppearanceSettings({ soundTheme: e.target.value as SoundThemeValue }))}
              >
                <option value="vibe">{labels.soundVibeLinked}</option>
                <option value="default">{labels.defaultVibe}</option>
                <option value="anime">{labels.anime}</option>
                <option value="arcade">{labels.arcade}</option>
                <option value="cinema">{labels.cinema}</option>
                <option value="newspaper">{labels.newspaper}</option>
                <option value="cyberwitch">{labels.cyberwitch}</option>
                <option value="fantasy">{labels.fantasy}</option>
                <option value="scifi">{labels.scifi}</option>
              </select>
            </label>
            <button
              className="btn"
              type="button"
              disabled={ui.performanceMode}
              onClick={() => {
                const next = !ui.soundEnabled;
                dispatch(setAppearanceSettings({ soundEnabled: next }));
                if (next) triggerSoundCue('success');
              }}
            >
              {labels.sound} {ui.soundEnabled ? labels.soundOn : labels.soundOff}
            </button>
            <label className="checkbox" title="Visual vibe preset">
              <span id="vibePrefix">{labels.vibePrefix}</span>
              <select
                id="vibeSelect"
                className="select"
                value={ui.vibe}
                onChange={e => dispatch(setAppearanceSettings({ vibe: e.target.value as TopMenuVibe }))}
              >
                <option value="default">{labels.defaultVibe}</option>
                <option value="anime">{labels.anime}</option>
                <option value="arcade">{labels.arcade}</option>
                <option value="cinema">{labels.cinema}</option>
                <option value="newspaper">{labels.newspaper}</option>
                <option value="cyberwitch">{labels.cyberwitch}</option>
                <option value="fantasy">{labels.fantasy}</option>
                <option value="scifi">{labels.scifi}</option>
              </select>
            </label>
            <label className="checkbox" title="Interface language">
              <span id="interfaceLangPrefix">{labels.interfacePrefix}</span>
              <select
                id="interfaceLang"
                className="select"
                value={ui.language}
                onChange={e => {
                  const nextLang = e.target.value as 'en' | 'bg';
                  dispatch(setLanguage(nextLang));
                }}
              >
                <option value="en">EN</option>
                <option value="bg">BG</option>
              </select>
            </label>
            <button className="btn" type="button" onClick={cycleTheme}>
              {labels.colorMode}: {ui.colorMode}
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => dispatch(setAppearanceSettings({ performanceMode: !ui.performanceMode }))}
            >
              {labels.perfMode}: {ui.performanceMode ? labels.perfOn : labels.perfOff}
            </button>
            {ui.performanceMode ? (
              <Alert severity="info" sx={{ py: 0 }}>
                {labels.perfFxSoundHidden}
              </Alert>
            ) : null}
          </div>
        </details>
      </div>

    </div>
  );

  const topActionButton = (id: string, label: string, icon: ReactNode, onClick: () => void) => {
    const onActionClick = () => {
      triggerSoundCue('toggle');
      onClick();
    };
    if (!menuItemsAsIcons) {
      return (
        <Button id={id} className="btn ghost" size="small" variant="outlined" type="button" onClick={onActionClick}>
          {label}
        </Button>
      );
    }
    return (
      <Tooltip title={label}>
        <Button
          id={id}
          className="btn ghost"
          size="small"
          variant="outlined"
          type="button"
          aria-label={label}
          onClick={onActionClick}
          sx={{ minWidth: 38, px: 0.95 }}
        >
          {icon}
        </Button>
      </Tooltip>
    );
  };

  return (
    <div className="topbar">
      <div className="topbarInner" id="topbarInner" ref={topbarInnerRef}>
        <div className="headerRow">
          <Box className="headerLeft">
            <Typography id="appTitle" component="h1" sx={{ margin: 0, fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>
              {labels.title}
            </Typography>
            {topHintAsButtons ? (
              <Stack className="subHintButtons" id="subHintButtons" direction="row" spacing={0.7} flexWrap="wrap">
                <Button className="subHintBtn" size="small" variant="outlined" type="button" onClick={scrollToColumns} startIcon={<OpenWithIcon fontSize="small" />}>
                  {labels.subHintDrag}
                </Button>
                <Button className="subHintBtn" size="small" variant="outlined" type="button" onClick={() => dispatch(setHelpOpen(true))}>
                  ? {labels.subHintHelp}
                </Button>
                <Button className="subHintBtn" size="small" variant="outlined" type="button" onClick={toggleMenu} startIcon={<MenuIcon fontSize="small" />}>
                  M {labels.subHintMenu}
                </Button>
                <Button className="subHintBtn" size="small" variant="outlined" type="button" onClick={toggleSearch} startIcon={<SearchIcon fontSize="small" />}>
                  / {labels.subHintSearch}
                </Button>
              </Stack>
            ) : (
              <div className="subHint" id="subHint">
                {labels.subHint}
              </div>
            )}
          </Box>

          {isMobile ? (
            <Stack className="headerRight mobileTopActions" spacing={1.1} sx={{ width: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap' }}>
                  <StatusPills connected={connected} status={status} totalTokens={totalTokens} />
                </Stack>
                <IconButton
                  id="menuToggle"
                  size="small"
                  onClick={toggleMenu}
                  sx={{ border: '1px solid var(--panel-border)', bgcolor: 'var(--field-bg)', color: 'var(--text-main)' }}
                >
                  <MenuIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          ) : (
            <Stack className="headerRight" direction="row" flexWrap="wrap" gap={1.1} alignItems="center">
              <StatusPills connected={connected} status={status} totalTokens={totalTokens} />
              <QuickVibeSelect
                value={ui.vibe}
                labels={labels}
                onChange={nextVibe => dispatch(setAppearanceSettings({ vibe: nextVibe }))}
              />
              {topActionButton('quickSearchBtn', searchLabel, <SearchIcon fontSize="small" />, toggleSearch)}
              {topActionButton('quickAddStreamBtn', addStreamLabel, <AddIcon fontSize="small" />, toggleAddStream)}
              {topActionButton('controlsToggle', controlsLabel, <TuneIcon fontSize="small" />, toggleControls)}
              {topActionButton('allColControlsToggle', allColumnLabel, <GridViewIcon fontSize="small" />, toggleAllColumnControls)}
              {topActionButton(
                'hideAllResearchBtn',
                ui.hideAllResearch ? labels.showAllResearch : labels.hideAllResearch,
                <AutoAwesomeIcon fontSize="small" />,
                () => dispatch(setHideAllResearch(!ui.hideAllResearch))
              )}
              {topActionButton(
                'hideAllSummariesBtn',
                ui.hideAllSummaries ? labels.showAllSummaries : labels.hideAllSummaries,
                <SummarizeIcon fontSize="small" />,
                () => dispatch(setHideAllSummaries(!ui.hideAllSummaries))
              )}
              {topActionButton('menuToggle', menuLabel, <MenuIcon fontSize="small" />, toggleMenu)}
            </Stack>
          )}
        </div>

        {showDesktopBody && ui.searchVisible ? searchSection : null}
        {showDesktopBody && ui.addStreamVisible ? addStreamSection : null}
        {showDesktopBody ? controlsPanel : null}
      </div>

      {isMobile ? (
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          PaperProps={{ className: 'mobileDrawerPaper' }}
        >
          <Box className="mobileDrawerHeader">
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{labels.title}</Typography>
            <IconButton onClick={() => setMobileDrawerOpen(false)} sx={{ color: 'var(--text-main)' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ borderColor: 'var(--panel-border)' }} />
          <Box sx={{ p: 1.4, overflowY: 'auto' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <QuickVibeSelect
                value={ui.vibe}
                labels={labels}
                fullWidth
                onChange={nextVibe => dispatch(setAppearanceSettings({ vibe: nextVibe }))}
              />
            </Stack>
            <Stack spacing={1}>
              <Button variant="outlined" onClick={toggleSearch} startIcon={<SearchIcon fontSize="small" />}>
                {searchLabel}
              </Button>
              <Button variant="outlined" onClick={toggleAddStream} startIcon={<AddIcon fontSize="small" />}>
                {addStreamLabel}
              </Button>
              <Button variant="outlined" onClick={toggleControls} startIcon={<TuneIcon fontSize="small" />}>
                {controlsLabel}
              </Button>
              <Button variant="outlined" onClick={toggleAllColumnControls}>
                {allColumnLabel}
              </Button>
              <Button
                variant="outlined"
                onClick={() => dispatch(setHideAllResearch(!ui.hideAllResearch))}
              >
                {ui.hideAllResearch ? labels.showAllResearch : labels.hideAllResearch}
              </Button>
              <Button
                variant="outlined"
                onClick={() => dispatch(setHideAllSummaries(!ui.hideAllSummaries))}
              >
                {ui.hideAllSummaries ? labels.showAllSummaries : labels.hideAllSummaries}
              </Button>
            </Stack>
            <Box sx={{ mt: 1.4, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.8, color: 'var(--text-muted)', fontWeight: 800 }}>
                {labels.reorderColumns}
              </Typography>
              <Stack spacing={0.7}>
                {orderedFeeds.map((feed, idx) => {
                  const isFixed = feed.url === FILTERED_FEED_URL;
                  const prev = orderedFeeds[idx - 1];
                  const next = orderedFeeds[idx + 1];
                  const canMoveUp = !isFixed && !!prev && prev.url !== FILTERED_FEED_URL;
                  const canMoveDown = !isFixed && !!next;
                  return (
                    <Stack
                      key={`mobile-order-${feed.url}`}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 0.8,
                        border: '1px solid var(--panel-border)',
                        borderRadius: '12px',
                        background: 'var(--field-bg)'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, pr: 1 }}>
                        {feed.label}
                      </Typography>
                      <Stack direction="row" spacing={0.4}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (!canMoveUp || !prev) return;
                            dispatch(reorderFeeds({ fromUrl: feed.url, toUrl: prev.url }));
                          }}
                          disabled={!canMoveUp}
                          aria-label={labels.moveUp}
                          sx={{ border: '1px solid var(--panel-border)', borderRadius: '10px' }}
                        >
                          <ArrowUpwardIcon fontSize="inherit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (!canMoveDown || !next) return;
                            dispatch(reorderFeeds({ fromUrl: feed.url, toUrl: next.url }));
                          }}
                          disabled={!canMoveDown}
                          aria-label={labels.moveDown}
                          sx={{ border: '1px solid var(--panel-border)', borderRadius: '10px' }}
                        >
                          <ArrowDownwardIcon fontSize="inherit" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
            {ui.searchVisible ? searchSection : null}
            {ui.addStreamVisible ? addStreamSection : null}
            {controlsPanel}
          </Box>
        </Drawer>
      ) : null}
      <HelpDialog
        open={ui.helpOpen}
        title={labels.helpTitle}
        closeLabel={labels.close}
        onClose={() => dispatch(setHelpOpen(false))}
      />
      <ToastStack toasts={toasts} onDismiss={id => dispatch(dismissToast(id))} />
    </div>
  );
}
