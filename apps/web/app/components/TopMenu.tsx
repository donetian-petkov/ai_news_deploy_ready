'use client';

import { useEffect } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLanguage, setTopUiState } from '../store/slices/uiSlice';

type VibeValue = 'default' | 'anime' | 'arcade' | 'cinema' | 'newspaper' | 'cyberwitch' | 'fantasy' | 'scifi';
type TopStateDetail = {
  menuCollapsed?: boolean;
  controlsCollapsed?: boolean;
  searchVisible?: boolean;
  addStreamVisible?: boolean;
  allColumnControlsHidden?: boolean;
  vibe?: VibeValue;
  language?: 'en' | 'bg';
};

const VIBES: VibeValue[] = ['default', 'anime', 'arcade', 'cinema', 'newspaper', 'cyberwitch', 'fantasy', 'scifi'];

declare global {
  interface Window {
    __AI_NEWS_USE_REACT_TOPMENU?: boolean;
  }
}

function StatusPills() {
  const connected = useAppSelector(s => s.connection.connected);
  const status = useAppSelector(s => s.connection.status);
  const totalTokens = useAppSelector(s => s.aiUsage.totalTokens);
  const label = connected ? 'Connected' : status === 'error' ? 'Socket error' : status === 'connecting' ? 'Connecting...' : 'Disconnected';

  return (
    <>
      <Chip id="status" className="statusPill" size="small" label={label} color={connected ? 'success' : 'default'} variant={connected ? 'filled' : 'outlined'} />
      <Chip id="tokenUsage" className="statusPill" size="small" label={`Tokens: ${totalTokens.toLocaleString('en-US')}`} variant="outlined" />
    </>
  );
}

export default function TopMenu() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(s => s.ui);
  const lang = ui.language;
  const bg = lang === 'bg';
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
    hideMenu: bg ? 'Скрий меню' : 'Hide menu',
    showMenu: bg ? 'Покажи меню' : 'Show menu',
    anime: bg ? 'Аниме Поп' : 'Anime Pop',
    arcade: bg ? 'Видео игра' : 'Video Game',
    cinema: bg ? 'Кино вечер' : 'Movie Night',
    newspaper: bg ? 'Вестник' : 'Newspaper',
    cyberwitch: bg ? 'Кибер вещица' : 'Cyber Witch',
    fantasy: bg ? 'Фентъзи' : 'Fantasy',
    scifi: bg ? 'Научна фантастика' : 'Sci-Fi',
    defaultVibe: bg ? 'По подразбиране' : 'Default'
  } as const;

  useEffect(() => {
    window.__AI_NEWS_USE_REACT_TOPMENU = true;

    const onTopState = (event: Event) => {
      const detail = (event as CustomEvent<TopStateDetail>).detail || {};
      const next: TopStateDetail = {};
      if (typeof detail.menuCollapsed === 'boolean') next.menuCollapsed = detail.menuCollapsed;
      if (typeof detail.controlsCollapsed === 'boolean') next.controlsCollapsed = detail.controlsCollapsed;
      if (typeof detail.searchVisible === 'boolean') next.searchVisible = detail.searchVisible;
      if (typeof detail.addStreamVisible === 'boolean') next.addStreamVisible = detail.addStreamVisible;
      if (typeof detail.allColumnControlsHidden === 'boolean') next.allColumnControlsHidden = detail.allColumnControlsHidden;
      if (typeof detail.vibe === 'string' && VIBES.includes(detail.vibe)) next.vibe = detail.vibe;
      dispatch(setTopUiState(next));
      if (detail.language === 'en' || detail.language === 'bg') {
        dispatch(setLanguage(detail.language));
      }
    };

    window.addEventListener('ai-news:top-state', onTopState as EventListener);
    window.dispatchEvent(new CustomEvent('ai-news:request-top-state'));

    return () => {
      window.removeEventListener('ai-news:top-state', onTopState as EventListener);
    };
  }, [dispatch]);

  const emit = (type: string, detail?: object) => {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  };

  const searchLabel = ui.searchVisible ? labels.hideSearch : labels.search;
  const addStreamLabel = ui.addStreamVisible ? labels.hideAddStream : labels.addStream;
  const controlsLabel = ui.controlsCollapsed ? labels.showTopControls : labels.hideTopControls;
  const allColumnLabel = ui.allColumnControlsHidden ? labels.showAllColumnControls : labels.hideAllColumnControls;
  const menuLabel = ui.menuCollapsed ? labels.showMenu : labels.hideMenu;

  return (
    <div className="topbar">
      <div className="topbarInner" id="topbarInner">
        <div className="headerRow">
          <Box className="headerLeft">
            <Typography id="appTitle" component="h1" sx={{ margin: 0, fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>
              {labels.title}
            </Typography>
            <div className="subHint" id="subHint">
              {labels.subHint}
            </div>
          </Box>

          <Stack className="headerRight" direction="row" flexWrap="wrap" gap={1.1} alignItems="center">
            <StatusPills />
            <label className="checkbox topQuickLabel" title="Quick vibe switch">
              <span id="quickVibeLabelText">{labels.vibe}</span>
              <select
                id="quickVibeSelect"
                className="select topQuickSelect"
                value={ui.vibe}
                onChange={e => emit('ai-news:set-vibe', { vibe: e.target.value })}
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
            <Button id="quickSearchBtn" className="btn ghost" size="small" variant="outlined" type="button" onClick={() => emit('ai-news:toggle-search')}>{searchLabel}</Button>
            <Button id="quickAddStreamBtn" className="btn ghost" size="small" variant="outlined" type="button" onClick={() => emit('ai-news:toggle-add-stream')}>{addStreamLabel}</Button>
            <Button id="controlsToggle" className="btn ghost" size="small" variant="outlined" type="button" onClick={() => emit('ai-news:toggle-controls')}>{controlsLabel}</Button>
            <Button id="allColControlsToggle" className="btn ghost" size="small" variant="outlined" type="button" onClick={() => emit('ai-news:toggle-all-column-controls')}>{allColumnLabel}</Button>
            <Button id="hideAllResearchBtn" className="btn ghost" size="small" variant="outlined" type="button" onClick={() => emit('ai-news:hide-all-research')}>{labels.hideAllResearch}</Button>
            <Button id="menuToggle" className="btn ghost" size="small" variant="outlined" type="button" onClick={() => emit('ai-news:toggle-menu')}>{menuLabel}</Button>
          </Stack>
        </div>

        <div className="controls">
          <div className="controlsCompactRow controlsRow">
            <div className="controlGroup">
              <button id="resetBtn" className="btn" type="button">Reset ALL to newest 10</button>
              <label className="checkbox" title="Delete old news by age from all columns">
                <span id="deleteAgePrefix">Delete age:</span>
                <select id="deleteAgeSelect" className="select" defaultValue="week">
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Past week</option>
                  <option value="month">Past month</option>
                  <option value="year">Past year</option>
                </select>
              </label>
              <button id="deleteAgeAllBtn" className="btn danger" type="button">Delete old (all columns)</button>
              <label className="checkbox" title="Embeddings matching, AI dedupe, summaries, research">
                <input id="aiEnabled" type="checkbox" />
                <span id="aiEnabledLabel">AI Enabled</span>
              </label>
              <button id="helpBtn" className="btn" type="button">Help</button>
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
                  <input id="notifyEnabled" type="checkbox" />
                  <span id="notifyEnabledLabel">Enable notifications</span>
                </label>
                <label className="checkbox">
                  <span id="notifyPrefix">Notify:</span>
                  <select id="notifyMode" className="select" defaultValue="matched">
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
                  <span id="summaryLangPrefix">Summary:</span>
                  <select id="summaryLang" className="select" defaultValue="bilingual">
                    <option value="bilingual">BG / EN</option>
                    <option value="bg">BG</option>
                    <option value="en">EN</option>
                  </select>
                </label>
                <label className="checkbox">
                  <span id="researchLangPrefix">Research:</span>
                  <select id="researchLang" className="select" defaultValue="bg">
                    <option value="bg">BG</option>
                    <option value="en">EN</option>
                  </select>
                </label>
                <label className="checkbox" title="Apply one budget to all columns">
                  <span id="allBudgetPrefix">AI Budget (all):</span>
                  <select id="allBudgetSelect" className="select" defaultValue="standard">
                    <option value="mixed">Mixed</option>
                    <option value="low">Low</option>
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>
            </details>

            <details className="controlSection" open>
              <summary id="appearanceSummary">Appearance</summary>
              <div className="controlGroup" id="appearanceGroup">
                <label className="checkbox" title="Change UI font">
                  <span id="fontPrefix">Font:</span>
                  <select id="fontSelect" className="select" defaultValue="system">
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
                  <select id="fontSizeSelect" className="select" defaultValue="md">
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </label>
                <label className="checkbox" title="Column accent scheme">
                  <span id="schemePrefix">Scheme:</span>
                  <select id="schemeSelect" className="select" defaultValue="classic">
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
                  <select id="btnModeSelect" className="select" defaultValue="icons">
                    <option value="icons">Icons</option>
                    <option value="text">Text</option>
                  </select>
                </label>
                <label className="checkbox" title="Visual vibe preset">
                  <span id="vibePrefix">Vibe:</span>
                  <select id="vibeSelect" className="select" defaultValue="default">
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
                  <select id="interfaceLang" className="select" defaultValue="en">
                    <option value="en">EN</option>
                    <option value="bg">BG</option>
                  </select>
                </label>
              </div>
            </details>
          </div>

          <details id="searchSection" className="controlSection controlSectionWide" open>
            <summary id="searchSummary">Search</summary>
            <div className="searchRow">
              <input
                id="searchInput"
                className="input"
                placeholder="Search (title + summary + research)..."
              />
              <button id="clearSearchBtn" className="btn" type="button">Clear</button>
            </div>
            <div id="searchInfo"></div>
          </details>

          <details id="addStreamSection" className="controlSection controlSectionWide">
            <summary id="addStreamSummary">Add Stream</summary>
            <div className="addRow addRow4">
              <select id="feedType" className="select" defaultValue="rss">
                <option value="rss">RSS</option>
                <option value="reddit">Reddit (subreddit)</option>
                <option value="youtube">YouTube (channel)</option>
              </select>

              <input id="feedUrl" className="input" placeholder="Paste RSS URL OR subreddit OR YouTube channel URL..." />
              <input id="feedLabel" className="input" placeholder="Optional label" />

              <select id="feedInterval" className="select" title="Polling interval" defaultValue="120">
                <option value="45">45s</option>
                <option value="60">60s</option>
                <option value="90">90s</option>
                <option value="120">120s</option>
                <option value="180">180s</option>
                <option value="300">300s</option>
              </select>

              <button id="addFeedBtn" className="btn" type="button">Add Stream</button>
            </div>
            <div id="addFeedStatus"></div>
          </details>
        </div>
      </div>
    </div>
  );
}
