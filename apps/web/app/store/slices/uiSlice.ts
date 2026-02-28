import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const isVibe = (value: string): value is UiState['vibe'] =>
  value === 'default'
  || value === 'anime'
  || value === 'arcade'
  || value === 'cinema'
  || value === 'newspaper'
  || value === 'cyberwitch'
  || value === 'fantasy'
  || value === 'scifi';

type UiState = {
  language: 'en' | 'bg';
  colorMode: 'system' | 'dark' | 'light';
  searchQuery: string;
  menuCollapsed: boolean;
  controlsCollapsed: boolean;
  searchVisible: boolean;
  addStreamVisible: boolean;
  allColumnControlsHidden: boolean;
  hideAllResearchSeq: number;
  hideAllResearch: boolean;
  hideAllSummaries: boolean;
  showMoreNewsAllSeq: number;
  resetNewsShownAllSeq: number;
  helpOpen: boolean;
  notifyEnabled: boolean;
  notifyMode: 'matched' | 'matched_pinned' | 'pinned' | 'all';
  aiAvailable: boolean;
  aiEnabled: boolean;
  aiProvider: 'openai' | 'claude' | 'openrouter';
  moodFilter: 'all' | 'pesimistic' | 'optimistic' | 'realistic' | 'melancholy' | 'happiness' | 'sadness' | 'rage' | 'uncertainty' | 'neutral' | 'curios';
  typeFilter: 'all' | 'science' | 'movies' | 'politics' | 'business' | 'technology' | 'sports' | 'health' | 'world' | 'culture' | 'environment' | 'crime' | 'education' | 'other';
  summaryLang: 'bilingual' | 'bg' | 'en';
  researchLang: 'bg' | 'en';
  allBudget: 'mixed' | 'low' | 'standard' | 'high';
  font: 'system' | 'manrope' | 'grotesk' | 'sora' | 'plex' | 'serif' | 'mono';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  scheme: 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest';
  performanceMode: boolean;
  buttonMode: 'icons' | 'text';
  menuHintMode: 'text' | 'buttons';
  vibe: 'default' | 'anime' | 'arcade' | 'cinema' | 'newspaper' | 'cyberwitch' | 'fantasy' | 'scifi';
  toasts: Array<{ id: string; kind: 'info' | 'success' | 'error'; message: string }>;
};

const initialState: UiState = {
  language: 'en',
  colorMode: 'system',
  searchQuery: '',
  menuCollapsed: false,
  controlsCollapsed: false,
  searchVisible: true,
  addStreamVisible: false,
  allColumnControlsHidden: false,
  hideAllResearchSeq: 0,
  hideAllResearch: false,
  hideAllSummaries: false,
  showMoreNewsAllSeq: 0,
  resetNewsShownAllSeq: 0,
  helpOpen: false,
  notifyEnabled: false,
  notifyMode: 'matched',
  aiAvailable: false,
  aiEnabled: false,
  aiProvider: 'openai',
  moodFilter: 'all',
  typeFilter: 'all',
  summaryLang: 'bilingual',
  researchLang: 'bg',
  allBudget: 'standard',
  font: 'system',
  fontSize: 'md',
  scheme: 'classic',
  performanceMode: false,
  buttonMode: 'icons',
  menuHintMode: 'text',
  vibe: 'default',
  toasts: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<'en' | 'bg'>) {
      state.language = action.payload;
    },
    setColorMode(state, action: PayloadAction<'system' | 'dark' | 'light'>) {
      state.colorMode = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = String(action.payload || '');
    },
    setTopUiState(state, action: PayloadAction<Partial<Pick<UiState, 'menuCollapsed' | 'controlsCollapsed' | 'searchVisible' | 'addStreamVisible' | 'allColumnControlsHidden' | 'vibe'>>>) {
      const next = action.payload;
      if (typeof next.menuCollapsed === 'boolean') state.menuCollapsed = next.menuCollapsed;
      if (typeof next.controlsCollapsed === 'boolean') state.controlsCollapsed = next.controlsCollapsed;
      if (typeof next.searchVisible === 'boolean') state.searchVisible = next.searchVisible;
      if (typeof next.addStreamVisible === 'boolean') state.addStreamVisible = next.addStreamVisible;
      if (typeof next.allColumnControlsHidden === 'boolean') state.allColumnControlsHidden = next.allColumnControlsHidden;
      if (typeof next.vibe === 'string' && isVibe(next.vibe)) state.vibe = next.vibe;
    },
    triggerHideAllResearch(state) {
      state.hideAllResearchSeq += 1;
      state.hideAllResearch = true;
    },
    setHideAllResearch(state, action: PayloadAction<boolean>) {
      state.hideAllResearch = !!action.payload;
      if (state.hideAllResearch) state.hideAllResearchSeq += 1;
    },
    setHideAllSummaries(state, action: PayloadAction<boolean>) {
      state.hideAllSummaries = !!action.payload;
    },
    triggerShowMoreNewsAll(state) {
      state.showMoreNewsAllSeq += 1;
    },
    triggerResetNewsShownAll(state) {
      state.resetNewsShownAllSeq += 1;
    },
    setHelpOpen(state, action: PayloadAction<boolean>) {
      state.helpOpen = !!action.payload;
    },
    setNotifySettings(state, action: PayloadAction<Partial<Pick<UiState, 'notifyEnabled' | 'notifyMode'>>>) {
      const next = action.payload;
      if (typeof next.notifyEnabled === 'boolean') state.notifyEnabled = next.notifyEnabled;
      if (next.notifyMode === 'matched' || next.notifyMode === 'matched_pinned' || next.notifyMode === 'pinned' || next.notifyMode === 'all') {
        state.notifyMode = next.notifyMode;
      }
    },
    setAiSettings(state, action: PayloadAction<Partial<Pick<UiState, 'aiAvailable' | 'aiEnabled' | 'aiProvider' | 'summaryLang' | 'researchLang' | 'allBudget'>>>) {
      const next = action.payload;
      if (typeof next.aiAvailable === 'boolean') state.aiAvailable = next.aiAvailable;
      if (typeof next.aiEnabled === 'boolean') state.aiEnabled = next.aiEnabled;
      if (next.aiProvider === 'openai' || next.aiProvider === 'claude' || next.aiProvider === 'openrouter') state.aiProvider = next.aiProvider;
      if (next.summaryLang === 'bg' || next.summaryLang === 'en' || next.summaryLang === 'bilingual') state.summaryLang = next.summaryLang;
      if (next.researchLang === 'bg' || next.researchLang === 'en') state.researchLang = next.researchLang;
      if (next.allBudget === 'mixed' || next.allBudget === 'low' || next.allBudget === 'standard' || next.allBudget === 'high') state.allBudget = next.allBudget;
    },
    setMoodFilter(state, action: PayloadAction<UiState['moodFilter']>) {
      if (state.performanceMode) {
        state.moodFilter = 'all';
        return;
      }
      const next = action.payload;
      if (
        next === 'all'
        || next === 'pesimistic'
        || next === 'optimistic'
        || next === 'realistic'
        || next === 'melancholy'
        || next === 'happiness'
        || next === 'sadness'
        || next === 'rage'
        || next === 'uncertainty'
        || next === 'neutral'
        || next === 'curios'
      ) {
        state.moodFilter = next;
      }
    },
    setTypeFilter(state, action: PayloadAction<UiState['typeFilter']>) {
      if (state.performanceMode) {
        state.typeFilter = 'all';
        return;
      }
      const next = action.payload;
      if (
        next === 'all'
        || next === 'science'
        || next === 'movies'
        || next === 'politics'
        || next === 'business'
        || next === 'technology'
        || next === 'sports'
        || next === 'health'
        || next === 'world'
        || next === 'culture'
        || next === 'environment'
        || next === 'crime'
        || next === 'education'
        || next === 'other'
      ) {
        state.typeFilter = next;
      }
    },
    setAppearanceSettings(state, action: PayloadAction<Partial<Pick<UiState, 'font' | 'fontSize' | 'scheme' | 'performanceMode' | 'buttonMode' | 'menuHintMode' | 'vibe' | 'colorMode'>>>) {
      const next = action.payload;
      if (next.font === 'system' || next.font === 'manrope' || next.font === 'grotesk' || next.font === 'sora' || next.font === 'plex' || next.font === 'serif' || next.font === 'mono') {
        state.font = next.font;
      }
      if (next.fontSize === 'sm' || next.fontSize === 'md' || next.fontSize === 'lg' || next.fontSize === 'xl') {
        state.fontSize = next.fontSize;
      }
      if (next.scheme === 'classic' || next.scheme === 'vivid' || next.scheme === 'sunset' || next.scheme === 'neon' || next.scheme === 'ocean' || next.scheme === 'forest') {
        state.scheme = next.scheme;
      }
      if (typeof next.performanceMode === 'boolean') {
        state.performanceMode = next.performanceMode;
        if (next.performanceMode) {
          state.moodFilter = 'all';
          state.typeFilter = 'all';
        }
      }
      if (next.buttonMode === 'icons' || next.buttonMode === 'text') {
        state.buttonMode = next.buttonMode;
      }
      if (next.menuHintMode === 'text' || next.menuHintMode === 'buttons') {
        state.menuHintMode = next.menuHintMode;
      }
      if (next.colorMode === 'system' || next.colorMode === 'dark' || next.colorMode === 'light') {
        state.colorMode = next.colorMode;
      }
      if (typeof next.vibe === 'string' && isVibe(next.vibe)) state.vibe = next.vibe;
    },
    hydrateUiSettings(state, action: PayloadAction<Partial<Pick<UiState, 'language' | 'colorMode' | 'menuCollapsed' | 'controlsCollapsed' | 'searchVisible' | 'addStreamVisible' | 'allColumnControlsHidden' | 'hideAllResearch' | 'hideAllSummaries' | 'notifyEnabled' | 'notifyMode' | 'moodFilter' | 'typeFilter' | 'font' | 'fontSize' | 'scheme' | 'performanceMode' | 'buttonMode' | 'menuHintMode' | 'vibe'>>>) {
      const next = action.payload;
      if (next.language === 'en' || next.language === 'bg') state.language = next.language;
      if (next.colorMode === 'system' || next.colorMode === 'dark' || next.colorMode === 'light') state.colorMode = next.colorMode;
      if (typeof next.menuCollapsed === 'boolean') state.menuCollapsed = next.menuCollapsed;
      if (typeof next.controlsCollapsed === 'boolean') state.controlsCollapsed = next.controlsCollapsed;
      if (typeof next.searchVisible === 'boolean') state.searchVisible = next.searchVisible;
      if (typeof next.addStreamVisible === 'boolean') state.addStreamVisible = next.addStreamVisible;
      if (typeof next.allColumnControlsHidden === 'boolean') state.allColumnControlsHidden = next.allColumnControlsHidden;
      if (typeof next.hideAllResearch === 'boolean') state.hideAllResearch = next.hideAllResearch;
      if (typeof next.hideAllSummaries === 'boolean') state.hideAllSummaries = next.hideAllSummaries;
      if (typeof next.notifyEnabled === 'boolean') state.notifyEnabled = next.notifyEnabled;
      if (next.notifyMode === 'matched' || next.notifyMode === 'matched_pinned' || next.notifyMode === 'pinned' || next.notifyMode === 'all') state.notifyMode = next.notifyMode;
      if (
        next.moodFilter === 'all'
        || next.moodFilter === 'pesimistic'
        || next.moodFilter === 'optimistic'
        || next.moodFilter === 'realistic'
        || next.moodFilter === 'melancholy'
        || next.moodFilter === 'happiness'
        || next.moodFilter === 'sadness'
        || next.moodFilter === 'rage'
        || next.moodFilter === 'uncertainty'
        || next.moodFilter === 'neutral'
        || next.moodFilter === 'curios'
      ) state.moodFilter = next.moodFilter;
      if (
        next.typeFilter === 'all'
        || next.typeFilter === 'science'
        || next.typeFilter === 'movies'
        || next.typeFilter === 'politics'
        || next.typeFilter === 'business'
        || next.typeFilter === 'technology'
        || next.typeFilter === 'sports'
        || next.typeFilter === 'health'
        || next.typeFilter === 'world'
        || next.typeFilter === 'culture'
        || next.typeFilter === 'environment'
        || next.typeFilter === 'crime'
        || next.typeFilter === 'education'
        || next.typeFilter === 'other'
      ) state.typeFilter = next.typeFilter;
      if (next.font === 'system' || next.font === 'manrope' || next.font === 'grotesk' || next.font === 'sora' || next.font === 'plex' || next.font === 'serif' || next.font === 'mono') state.font = next.font;
      if (next.fontSize === 'sm' || next.fontSize === 'md' || next.fontSize === 'lg' || next.fontSize === 'xl') state.fontSize = next.fontSize;
      if (next.scheme === 'classic' || next.scheme === 'vivid' || next.scheme === 'sunset' || next.scheme === 'neon' || next.scheme === 'ocean' || next.scheme === 'forest') state.scheme = next.scheme;
      if (typeof next.performanceMode === 'boolean') state.performanceMode = next.performanceMode;
      if (state.performanceMode) {
        state.moodFilter = 'all';
        state.typeFilter = 'all';
      }
      if (next.buttonMode === 'icons' || next.buttonMode === 'text') state.buttonMode = next.buttonMode;
      if (next.menuHintMode === 'text' || next.menuHintMode === 'buttons') state.menuHintMode = next.menuHintMode;
      if (typeof next.vibe === 'string' && isVibe(next.vibe)) state.vibe = next.vibe;
    },
    enqueueToast(state, action: PayloadAction<{ kind: 'info' | 'success' | 'error'; message: string }>) {
      const message = String(action.payload.message || '').trim();
      if (!message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      state.toasts.push({ id, kind: action.payload.kind, message });
      if (state.toasts.length > 8) {
        state.toasts.splice(0, state.toasts.length - 8);
      }
    },
    dismissToast(state, action: PayloadAction<string>) {
      const id = String(action.payload || '');
      if (!id) return;
      state.toasts = state.toasts.filter(t => t.id !== id);
    }
  }
});

export const {
  setLanguage,
  setColorMode,
  setSearchQuery,
  setTopUiState,
  triggerHideAllResearch,
  setHideAllResearch,
  setHideAllSummaries,
  triggerShowMoreNewsAll,
  triggerResetNewsShownAll,
  setHelpOpen,
  setNotifySettings,
  setAiSettings,
  setMoodFilter,
  setTypeFilter,
  setAppearanceSettings,
  hydrateUiSettings,
  enqueueToast,
  dismissToast
} = uiSlice.actions;
export default uiSlice.reducer;
