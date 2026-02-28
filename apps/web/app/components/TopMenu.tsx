'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Divider, Drawer, FormControl, IconButton, MenuItem, Select, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLanguage, setSearchQuery, setTopUiState, setHideAllResearch, setHideAllSummaries, setNotifySettings, setAiSettings, setMoodFilter, setTypeFilter, setAppearanceSettings, hydrateUiSettings, setHelpOpen, dismissToast, enqueueToast, triggerShowMoreNewsAll, triggerResetNewsShownAll } from '../store/slices/uiSlice';
import { sendWsMessage } from '../store/wsClient';
import { setFeedBudgetSetting } from '../store/slices/feedsSlice';
import { removeOldItemsInFeed, resetAllToNewestLimit } from '../store/slices/newsSlice';
import { AddStreamSection } from './top-menu/AddStreamSection';
import { HelpDialog } from './top-menu/HelpDialog';
import { QuickVibeSelect } from './top-menu/QuickVibeSelect';
import { SearchSection } from './top-menu/SearchSection';
import { StatusPills } from './top-menu/StatusPills';
import { ToastStack } from './top-menu/ToastStack';

type VibeValue = 'default' | 'anime' | 'arcade' | 'cinema' | 'newspaper' | 'cyberwitch' | 'fantasy' | 'scifi';
const VIBES: VibeValue[] = ['default', 'anime', 'arcade', 'cinema', 'newspaper', 'cyberwitch', 'fantasy', 'scifi'];
export default function TopMenu() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(s => s.ui);
  const connected = useAppSelector(s => s.connection.connected);
  const status = useAppSelector(s => s.connection.status);
  const totalTokens = useAppSelector(s => s.aiUsage.totalTokens);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const isMobile = useMediaQuery('(max-width: 900px)');
  const resolvedColorMode = ui.colorMode === 'system' ? (prefersDark ? 'dark' : 'light') : ui.colorMode;
  const feeds = useAppSelector(s => s.feeds.feeds);
  const lang = ui.language;
  const bg = lang === 'bg';
  const [searchDraft, setSearchDraft] = useState('');
  const [feedType, setFeedType] = useState<'rss' | 'reddit' | 'youtube'>('rss');
  const [feedUrl, setFeedUrl] = useState('');
  const [feedLabel, setFeedLabel] = useState('');
  const [feedInterval, setFeedInterval] = useState('120');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [deleteAgeAll, setDeleteAgeAll] = useState<'yesterday' | 'week' | 'month' | 'year'>('week');
  const [addStatus, setAddStatus] = useState<{ kind: 'info' | 'success' | 'error'; message: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const addStreamInputRef = useRef<HTMLInputElement | null>(null);
  const topbarInnerRef = useRef<HTMLDivElement | null>(null);
  const toastTimersRef = useRef<Record<string, number>>({});
  const toasts = useAppSelector(s => s.ui.toasts);

  const labels = {
    title: bg ? 'Поток Новини На Живо' : 'Live News Stream',
    subHint: bg ? 'Влачи колони · ? Помощ · M Меню · / Търсене' : 'Drag columns · ? Help · M Menu · / Search',
    vibe: bg ? 'Вайб:' : 'Vibe:',
    search: bg ? 'Търсене' : 'Search',
    hideSearch: bg ? 'Скрий търсене' : 'Hide Search',
    addStream: bg ? 'Добави поток' : 'Add Stream',
    hideAddStream: bg ? 'Скрий добавяне поток' : 'Hide Add Stream',
    hideTopControls: bg ? 'Скрий горни контроли' : 'Hide top controls',
    showTopControls: bg ? 'Покажи горни контроли' : 'Show top controls',
    hideAllColumnControls: bg ? 'Скрий всички контроли на колони' : 'Hide all column controls',
    showAllColumnControls: bg ? 'Покажи всички контроли на колони' : 'Show all column controls',
    hideAllResearch: bg ? 'Скрий всички проучвания' : 'Hide all research',
    showAllResearch: bg ? 'Покажи всички проучвания' : 'Show all research',
    hideAllSummaries: bg ? 'Скрий всички резюмета' : 'Hide all summaries',
    showAllSummaries: bg ? 'Покажи всички резюмета' : 'Show all summaries',
    showMoreNewsAll: bg ? 'Покажи +5 (всички колони)' : 'Show +5 (all columns)',
    resetNewsShownAll: bg ? 'Нулирай показани до 10' : 'Reset shown to 10',
    hideMenu: bg ? 'Скрий меню' : 'Hide menu',
    showMenu: bg ? 'Покажи меню' : 'Show menu',
    anime: bg ? 'Аниме Поп' : 'Anime Pop',
    arcade: bg ? 'Видео игра' : 'Video Game',
    cinema: bg ? 'Кино вечер' : 'Movie Night',
    newspaper: bg ? 'Вестник' : 'Newspaper',
    cyberwitch: bg ? 'Кибер вещица' : 'Cyber Witch',
    fantasy: bg ? 'Фентъзи' : 'Fantasy',
    scifi: bg ? 'Научна фантастика' : 'Sci-Fi',
    defaultVibe: bg ? 'По подразбиране' : 'Default',
    clear: bg ? 'Изчисти' : 'Clear',
    add: bg ? 'Добави поток' : 'Add Stream',
    adding: bg ? 'Добавяне...' : 'Adding...',
    enterValue: bg ? 'Въведи стойност' : 'Enter a value',
    searchPlaceholder: bg ? 'Търси (заглавие + резюме + проучване)...' : 'Search (title + summary + research)...',
    addUrlPlaceholder: bg ? 'Постави RSS URL, subreddit или YouTube канал...' : 'Paste RSS URL, subreddit, or YouTube channel URL...',
    addLabelPlaceholder: bg ? 'Етикет (по избор)' : 'Optional label',
    intervalSuffix: bg ? 'с' : 's',
    helpTitle: bg ? 'Помощ' : 'Help',
    close: bg ? 'Затвори' : 'Close',
    colorMode: bg ? 'Цветове' : 'Color mode',
    aiProvider: bg ? 'AI доставчик:' : 'AI provider:',
    moodFilter: bg ? 'Филтър настроение:' : 'Mood filter:',
    typeFilter: bg ? 'Филтър тип:' : 'Type filter:',
    openai: 'OpenAI',
    claude: 'Claude',
    openrouter: 'OpenRouter',
    moodAll: bg ? 'Всички' : 'All',
    moodPesimistic: bg ? 'Песимистично' : 'Pesimistic',
    moodOptimistic: bg ? 'Оптимистично' : 'Optimistic',
    moodRealistic: bg ? 'Реалистично' : 'Realistic',
    moodMelancholy: bg ? 'Меланхолия' : 'Melancholy',
    moodHappiness: bg ? 'Щастие' : 'Happiness',
    moodSadness: bg ? 'Тъга' : 'Sadness',
    moodRage: bg ? 'Ярост' : 'Rage',
    moodUncertainty: bg ? 'Несигурност' : 'Uncertainty',
    moodNeutral: bg ? 'Неутрално' : 'Neutral',
    moodCurios: bg ? 'Любопитство' : 'Curios',
    typeAll: bg ? 'Всички' : 'All',
    typeScience: bg ? 'Наука' : 'Science',
    typeMovies: bg ? 'Филми' : 'Movies',
    typePolitics: bg ? 'Политика' : 'Politics',
    typeBusiness: bg ? 'Бизнес' : 'Business',
    typeTechnology: bg ? 'Технологии' : 'Technology',
    typeSports: bg ? 'Спорт' : 'Sports',
    typeHealth: bg ? 'Здраве' : 'Health',
    typeWorld: bg ? 'Свят' : 'World',
    typeCulture: bg ? 'Култура' : 'Culture',
    typeEnvironment: bg ? 'Околна среда' : 'Environment',
    typeCrime: bg ? 'Криминални' : 'Crime',
    typeEducation: bg ? 'Образование' : 'Education',
    typeOther: bg ? 'Друго' : 'Other',
    perfAIFiltersHidden: bg ? 'AI филтрите за настроение/тип са изключени в режим производителност.' : 'Mood/type AI filters are disabled in Performance mode.',
    aiUnavailable: bg ? 'AI не е наличен за избрания доставчик. Добави валиден API ключ от AI Settings.' : 'AI is unavailable for the selected provider. Add a valid API key in AI Settings.',
    perfMode: bg ? 'Режим производителност' : 'Performance mode',
    perfOn: bg ? 'ВКЛ' : 'ON',
    perfOff: bg ? 'ИЗКЛ' : 'OFF'
  } as const;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('aiNews.uiPrefs.v2');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          language: 'en' | 'bg';
          colorMode: 'system' | 'dark' | 'light';
          menuCollapsed: boolean;
          controlsCollapsed: boolean;
          searchVisible: boolean;
          addStreamVisible: boolean;
          allColumnControlsHidden: boolean;
          hideAllResearch: boolean;
          hideAllSummaries: boolean;
          notifyEnabled: boolean;
          notifyMode: 'matched' | 'matched_pinned' | 'pinned' | 'all';
          moodFilter: 'all' | 'pesimistic' | 'optimistic' | 'realistic' | 'melancholy' | 'happiness' | 'sadness' | 'rage' | 'uncertainty' | 'neutral' | 'curios';
          typeFilter: 'all' | 'science' | 'movies' | 'politics' | 'business' | 'technology' | 'sports' | 'health' | 'world' | 'culture' | 'environment' | 'crime' | 'education' | 'other';
          font: 'system' | 'manrope' | 'grotesk' | 'sora' | 'plex' | 'serif' | 'mono';
          fontSize: 'sm' | 'md' | 'lg' | 'xl';
          scheme: 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest';
          performanceMode: boolean;
          buttonMode: 'icons' | 'text';
          vibe: VibeValue;
        }>;
        dispatch(hydrateUiSettings(parsed));
      }
    } catch {}
  }, [dispatch]);

  useEffect(() => {
    document.body.classList.toggle('menu-collapsed', ui.menuCollapsed);
    document.body.classList.toggle('controls-collapsed', ui.controlsCollapsed);
    document.body.dataset.vibe = ui.vibe;
    document.body.dataset.font = ui.font;
    document.body.dataset.fontSize = ui.fontSize;
    document.body.dataset.scheme = ui.scheme;
    document.body.dataset.performance = ui.performanceMode ? 'on' : 'off';
    document.body.dataset.itemButtons = ui.buttonMode;
    document.body.dataset.theme = resolvedColorMode;
    document.documentElement.dataset.theme = resolvedColorMode;
    document.body.dataset.themeSource = ui.colorMode;
    document.documentElement.dataset.themeSource = ui.colorMode;
    document.documentElement.lang = ui.language;
  }, [resolvedColorMode, ui.buttonMode, ui.colorMode, ui.controlsCollapsed, ui.font, ui.fontSize, ui.language, ui.menuCollapsed, ui.performanceMode, ui.scheme, ui.vibe]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('aiNews.uiPrefs.v2', JSON.stringify({
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
        vibe: ui.vibe
      }));
    } catch {}
  }, [ui.addStreamVisible, ui.allColumnControlsHidden, ui.hideAllResearch, ui.hideAllSummaries, ui.buttonMode, ui.colorMode, ui.controlsCollapsed, ui.font, ui.fontSize, ui.language, ui.menuCollapsed, ui.notifyEnabled, ui.notifyMode, ui.moodFilter, ui.typeFilter, ui.performanceMode, ui.scheme, ui.searchVisible, ui.vibe]);

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
    toasts.forEach(t => {
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
  }, [dispatch, toasts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dispatch(setSearchQuery(searchDraft));
    }, 90);
    return () => window.clearTimeout(timer);
  }, [dispatch, searchDraft]);

  useEffect(() => {
    if (!searchDraft && ui.searchQuery) {
      setSearchDraft(ui.searchQuery);
    }
  }, [searchDraft, ui.searchQuery]);

  useEffect(() => {
    if (ui.searchVisible) {
      window.setTimeout(() => searchInputRef.current?.focus(), 30);
    }
  }, [ui.searchVisible]);

  useEffect(() => {
    if (ui.addStreamVisible) {
      window.setTimeout(() => addStreamInputRef.current?.focus(), 30);
    }
  }, [ui.addStreamVisible]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(setHelpOpen(false));
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
        dispatch(setHelpOpen(!ui.helpOpen));
        return;
      }
      if (key === '/') {
        e.preventDefault();
        if (!ui.searchVisible) toggleSearch();
        window.setTimeout(() => searchInputRef.current?.focus(), 45);
        return;
      }
      if (lower === 'h') {
        e.preventDefault();
        dispatch(setHelpOpen(!ui.helpOpen));
        return;
      }
      if (lower === 'm') {
        e.preventDefault();
        toggleMenu();
        return;
      }
      if (lower === 'c') {
        e.preventDefault();
        toggleControls();
        return;
      }
      if (lower === 'g') {
        e.preventDefault();
        toggleAllColumnControls();
        return;
      }
      if (lower === 's') {
        e.preventDefault();
        toggleSearch();
        return;
      }
      if (lower === 'a') {
        e.preventDefault();
        toggleAddStream();
        return;
      }
      if (lower === 't') {
        e.preventDefault();
        cycleTheme();
        return;
      }
      if (lower === 'v') {
        e.preventDefault();
        cycleVibe();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dispatch, ui.addStreamVisible, ui.allColumnControlsHidden, ui.controlsCollapsed, ui.helpOpen, ui.menuCollapsed, ui.searchVisible, ui.vibe, ui.colorMode]);

  const clearSearch = () => {
    setSearchDraft('');
    dispatch(setSearchQuery(''));
  };

  const addStream = () => {
    if (!feedUrl.trim()) {
      setAddStatus({ kind: 'error', message: labels.enterValue });
      return;
    }
    setAddStatus({ kind: 'info', message: labels.adding });
    const ok = sendWsMessage({
      type: 'add_feed',
      kind: feedType,
      url: feedUrl.trim(),
      label: feedLabel.trim(),
      intervalSec: Number(feedInterval) || 120
    });
    if (!ok) {
      setAddStatus({
        kind: 'error',
        message: bg ? 'Няма връзка със сървъра' : 'No server connection'
      });
      return;
    }
    setAddStatus({ kind: 'success', message: bg ? 'Потокът е изпратен' : 'Stream submitted' });
    setFeedUrl('');
    setFeedLabel('');
  };

  const toggleSearch = () => {
    if (isMobile) {
      setMobileDrawerOpen(true);
    }
    dispatch(setTopUiState({
      menuCollapsed: false,
      searchVisible: !ui.searchVisible
    }));
  };

  const toggleAddStream = () => {
    if (isMobile) {
      setMobileDrawerOpen(true);
    }
    dispatch(setTopUiState({
      menuCollapsed: false,
      addStreamVisible: !ui.addStreamVisible
    }));
  };

  const toggleControls = () => {
    if (isMobile) {
      setMobileDrawerOpen(true);
    }
    dispatch(setTopUiState({
      menuCollapsed: false,
      controlsCollapsed: !ui.controlsCollapsed
    }));
  };

  const toggleMenu = () => {
    if (isMobile) {
      setMobileDrawerOpen(prev => !prev);
      return;
    }
    const next = !ui.menuCollapsed;
    dispatch(setTopUiState({
      menuCollapsed: next,
      controlsCollapsed: next ? ui.controlsCollapsed : false
    }));
  };

  const toggleAllColumnControls = () => {
    dispatch(setTopUiState({ allColumnControlsHidden: !ui.allColumnControlsHidden }));
  };

  const cycleTheme = () => {
    const order: Array<'system' | 'dark' | 'light'> = ['system', 'dark', 'light'];
    const idx = order.indexOf(ui.colorMode);
    dispatch(setAppearanceSettings({ colorMode: order[(idx + 1) % order.length] }));
  };

  const cycleVibe = () => {
    const idx = VIBES.indexOf(ui.vibe);
    dispatch(setAppearanceSettings({ vibe: VIBES[(idx + 1) % VIBES.length] }));
  };

  const cutoffFromAge = (age: 'yesterday' | 'week' | 'month' | 'year'): number => {
    const now = Date.now();
    if (age === 'yesterday') return now - 24 * 60 * 60 * 1000;
    if (age === 'month') return now - 30 * 24 * 60 * 60 * 1000;
    if (age === 'year') return now - 365 * 24 * 60 * 60 * 1000;
    return now - 7 * 24 * 60 * 60 * 1000;
  };

  const applyAllBudget = (budget: 'low' | 'standard' | 'high') => {
    const ok = sendWsMessage({ type: 'set_all_budget', budget });
    if (!ok) return;
    dispatch(setAiSettings({ allBudget: budget }));
    feeds.forEach(feed => {
      dispatch(setFeedBudgetSetting({ feedUrl: feed.url, budget }));
    });
  };

  const changeAiProvider = (provider: 'openai' | 'claude' | 'openrouter') => {
    const keyLabel = provider === 'claude'
      ? 'ANTHROPIC_API_KEY'
      : provider === 'openrouter'
        ? 'OPENROUTER_API_KEY'
        : 'OPENAI_API_KEY';
    const promptText = bg
      ? `Смяната на AI доставчик изисква API ключ (${keyLabel}). Въведи новия ключ:`
      : `Switching AI provider requires an API key (${keyLabel}). Enter the new key:`;
    const apiKey = window.prompt(promptText, '');
    if (apiKey === null) return;
    if (!apiKey.trim()) {
      dispatch(enqueueToast({
        kind: 'error',
        message: bg ? 'Смяната е прекратена: липсва API ключ.' : 'Provider switch cancelled: API key is required.'
      }));
      return;
    }
    const ok = sendWsMessage({ type: 'set_ai_provider', provider, apiKey: apiKey.trim() });
    if (!ok) {
      dispatch(enqueueToast({
        kind: 'error',
        message: bg ? 'Няма връзка със сървъра.' : 'No server connection.'
      }));
      return;
    }
  };

  const requestNotificationPermission = async (enabled: boolean) => {
    if (!enabled || typeof Notification === 'undefined') return;
    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch {}
  };

  const resetAllNewest = () => {
    dispatch(resetAllToNewestLimit(10));
  };

  const deleteOldAllColumns = () => {
    const cutoffMs = cutoffFromAge(deleteAgeAll);
    feeds.forEach(feed => {
      dispatch(removeOldItemsInFeed({ feedUrl: feed.url, cutoffMs }));
    });
  };

  const searchLabel = ui.searchVisible ? labels.hideSearch : labels.search;
  const addStreamLabel = ui.addStreamVisible ? labels.hideAddStream : labels.addStream;
  const controlsLabel = ui.controlsCollapsed ? labels.showTopControls : labels.hideTopControls;
  const allColumnLabel = ui.allColumnControlsHidden ? labels.showAllColumnControls : labels.hideAllColumnControls;
  const menuLabel = ui.menuCollapsed ? labels.showMenu : labels.hideMenu;
  const showDesktopBody = !isMobile && !ui.menuCollapsed;

  const searchSection = (
    <SearchSection
      isMobile={isMobile}
      searchDraft={searchDraft}
      onSearchDraftChange={setSearchDraft}
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
          <button id="resetBtn" className="btn" type="button" onClick={resetAllNewest}>Reset ALL to newest 10</button>
          <button id="showMoreNewsAllBtn" className="btn" type="button" onClick={() => dispatch(triggerShowMoreNewsAll())}>
            {labels.showMoreNewsAll}
          </button>
          <button id="resetNewsShownAllBtn" className="btn" type="button" onClick={() => dispatch(triggerResetNewsShownAll())}>
            {labels.resetNewsShownAll}
          </button>
          <label className="checkbox" title="Delete old news by age from all columns">
            <span id="deleteAgePrefix">Delete age:</span>
            <select id="deleteAgeSelect" className="select" value={deleteAgeAll} onChange={e => setDeleteAgeAll(e.target.value as 'yesterday' | 'week' | 'month' | 'year')}>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past week</option>
              <option value="month">Past month</option>
              <option value="year">Past year</option>
            </select>
          </label>
          <button id="deleteAgeAllBtn" className="btn danger" type="button" onClick={deleteOldAllColumns}>Delete old (all columns)</button>
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
                <span id="aiEnabledLabel">AI Enabled</span>
              </>
            ) : (
              <span id="aiUnavailableLabel">{labels.aiUnavailable}</span>
            )}
          </label>
          <button id="helpBtn" className="btn" type="button" onClick={() => dispatch(setHelpOpen(true))}>Help</button>
        </div>
      </div>
      <div className="controlsHint" id="controlsHint">
        Click section headers below to expand/collapse settings.
      </div>

      <div className="controlsGrid">
        <details className="controlSection" open>
          <summary id="notificationsSummary">Notifications</summary>
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
              <span id="notifyEnabledLabel">Enable notifications</span>
            </label>
            <label className="checkbox">
              <span id="notifyPrefix">Notify:</span>
              <select
                id="notifyMode"
                className="select"
                value={ui.notifyMode}
                onChange={e => dispatch(setNotifySettings({ notifyMode: e.target.value as 'matched' | 'matched_pinned' | 'pinned' | 'all' }))}
              >
                <option value="matched">Only matched</option>
                <option value="matched_pinned">Matched + pinned columns</option>
                <option value="pinned">Only pinned columns</option>
                <option value="all">All columns</option>
              </select>
            </label>
          </div>
        </details>

        <details className="controlSection" open>
          <summary id="aiSettingsSummary">AI Settings</summary>
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
              <span id="summaryLangPrefix">Summary:</span>
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
              <span id="researchLangPrefix">Research:</span>
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
              <span id="allBudgetPrefix">AI Budget (all):</span>
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
                <option value="mixed">Mixed</option>
                <option value="low">Low</option>
                <option value="standard">Standard</option>
                <option value="high">High</option>
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
          <summary id="appearanceSummary">Appearance</summary>
          <div className="controlGroup" id="appearanceGroup">
            <label className="checkbox" title="Change UI font">
              <span id="fontPrefix">Font:</span>
              <select
                id="fontSelect"
                className="select"
                value={ui.font}
                onChange={e => dispatch(setAppearanceSettings({ font: e.target.value as 'system' | 'manrope' | 'grotesk' | 'sora' | 'plex' | 'serif' | 'mono' }))}
              >
                <option value="system">System</option>
                <option value="manrope">Manrope</option>
                <option value="grotesk">Space Grotesk</option>
                <option value="sora">Sora</option>
                <option value="plex">IBM Plex Sans</option>
                <option value="serif">Serif</option>
                <option value="mono">Mono</option>
              </select>
            </label>
            <label className="checkbox" title="Scale text size">
              <span id="fontSizePrefix">Font size:</span>
              <select
                id="fontSizeSelect"
                className="select"
                value={ui.fontSize}
                onChange={e => dispatch(setAppearanceSettings({ fontSize: e.target.value as 'sm' | 'md' | 'lg' | 'xl' }))}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </label>
            <label className="checkbox" title="Column accent scheme">
              <span id="schemePrefix">Scheme:</span>
              <select
                id="schemeSelect"
                className="select"
                value={ui.scheme}
                onChange={e => dispatch(setAppearanceSettings({ scheme: e.target.value as 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest' }))}
              >
                <option value="classic">Classic</option>
                <option value="vivid">Vivid</option>
                <option value="sunset">Sunset</option>
                <option value="neon">Neon</option>
                <option value="ocean">Ocean</option>
                <option value="forest">Forest</option>
              </select>
            </label>
            <label className="checkbox" title="Item buttons look">
              <span id="buttonsPrefix">Buttons:</span>
              <select
                id="btnModeSelect"
                className="select"
                value={ui.buttonMode}
                onChange={e => dispatch(setAppearanceSettings({ buttonMode: e.target.value as 'icons' | 'text' }))}
              >
                <option value="icons">Icons</option>
                <option value="text">Text</option>
              </select>
            </label>
            <label className="checkbox" title="Visual vibe preset">
              <span id="vibePrefix">Vibe:</span>
              <select
                id="vibeSelect"
                className="select"
                value={ui.vibe}
                onChange={e => dispatch(setAppearanceSettings({ vibe: e.target.value as VibeValue }))}
              >
                <option value="default">Default</option>
                <option value="anime">Anime Pop</option>
                <option value="arcade">Video Game</option>
                <option value="cinema">Movie Night</option>
                <option value="newspaper">Newspaper</option>
                <option value="cyberwitch">Cyber Witch</option>
                <option value="fantasy">Fantasy</option>
                <option value="scifi">Sci-Fi</option>
              </select>
            </label>
            <label className="checkbox" title="Interface language">
              <span id="interfaceLangPrefix">Interface:</span>
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
          </div>
        </details>
      </div>

    </div>
  );

  return (
    <div className="topbar">
      <div className="topbarInner" id="topbarInner" ref={topbarInnerRef}>
        <div className="headerRow">
          <Box className="headerLeft">
            <Typography id="appTitle" component="h1" sx={{ margin: 0, fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>
              {labels.title}
            </Typography>
            <div className="subHint" id="subHint">
              {labels.subHint}
            </div>
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
              <Stack direction="row" spacing={1} alignItems="center">
                <QuickVibeSelect
                  value={ui.vibe}
                  labels={labels}
                  fullWidth
                  onChange={nextVibe => dispatch(setAppearanceSettings({ vibe: nextVibe }))}
                />
              </Stack>
              <Stack direction="row" spacing={1} className="mobileTopQuickButtons">
                <Tooltip title={searchLabel}>
                  <Button
                    id="quickSearchBtn"
                    className="btn ghost"
                    size="small"
                    variant={ui.searchVisible ? 'contained' : 'outlined'}
                    type="button"
                    onClick={toggleSearch}
                    aria-label={searchLabel}
                    sx={{ flex: 1, minWidth: 0, height: 44, p: 0 }}
                  >
                    <SearchIcon fontSize="small" />
                  </Button>
                </Tooltip>
                <Tooltip title={addStreamLabel}>
                  <Button
                    id="quickAddStreamBtn"
                    className="btn ghost"
                    size="small"
                    variant={ui.addStreamVisible ? 'contained' : 'outlined'}
                    type="button"
                    onClick={toggleAddStream}
                    aria-label={addStreamLabel}
                    sx={{ flex: 1, minWidth: 0, height: 44, p: 0 }}
                  >
                    <AddIcon fontSize="small" />
                  </Button>
                </Tooltip>
                <Tooltip title={controlsLabel}>
                  <Button
                    id="controlsToggle"
                    className="btn ghost"
                    size="small"
                    variant={!ui.controlsCollapsed ? 'contained' : 'outlined'}
                    type="button"
                    onClick={toggleControls}
                    aria-label={controlsLabel}
                    sx={{ flex: 1, minWidth: 0, height: 44, p: 0 }}
                  >
                    <TuneIcon fontSize="small" />
                  </Button>
                </Tooltip>
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
              <Button id="quickSearchBtn" className="btn ghost" size="small" variant="outlined" type="button" onClick={toggleSearch}>{searchLabel}</Button>
              <Button id="quickAddStreamBtn" className="btn ghost" size="small" variant="outlined" type="button" onClick={toggleAddStream}>{addStreamLabel}</Button>
              <Button id="controlsToggle" className="btn ghost" size="small" variant="outlined" type="button" onClick={toggleControls}>{controlsLabel}</Button>
              <Button id="allColControlsToggle" className="btn ghost" size="small" variant="outlined" type="button" onClick={toggleAllColumnControls}>{allColumnLabel}</Button>
              <Button
                id="hideAllResearchBtn"
                className="btn ghost"
                size="small"
                variant="outlined"
                type="button"
                onClick={() => dispatch(setHideAllResearch(!ui.hideAllResearch))}
              >
                {ui.hideAllResearch ? labels.showAllResearch : labels.hideAllResearch}
              </Button>
              <Button
                id="hideAllSummariesBtn"
                className="btn ghost"
                size="small"
                variant="outlined"
                type="button"
                onClick={() => dispatch(setHideAllSummaries(!ui.hideAllSummaries))}
              >
                {ui.hideAllSummaries ? labels.showAllSummaries : labels.hideAllSummaries}
              </Button>
              <Button id="menuToggle" className="btn ghost" size="small" variant="outlined" type="button" onClick={toggleMenu}>{menuLabel}</Button>
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
