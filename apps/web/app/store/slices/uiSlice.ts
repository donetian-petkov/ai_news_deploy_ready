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
  helpOpen: boolean;
  notifyEnabled: boolean;
  notifyMode: 'matched' | 'matched_pinned' | 'pinned' | 'all';
  aiAvailable: boolean;
  aiEnabled: boolean;
  summaryLang: 'bilingual' | 'bg' | 'en';
  researchLang: 'bg' | 'en';
  allBudget: 'mixed' | 'low' | 'standard' | 'high';
  font: 'system' | 'manrope' | 'grotesk' | 'sora' | 'plex' | 'serif' | 'mono';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  scheme: 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest';
  buttonMode: 'icons' | 'text';
  vibe: 'default' | 'anime' | 'arcade' | 'cinema' | 'newspaper' | 'cyberwitch' | 'fantasy' | 'scifi';
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
  helpOpen: false,
  notifyEnabled: false,
  notifyMode: 'matched',
  aiAvailable: false,
  aiEnabled: false,
  summaryLang: 'bilingual',
  researchLang: 'bg',
  allBudget: 'standard',
  font: 'system',
  fontSize: 'md',
  scheme: 'classic',
  buttonMode: 'icons',
  vibe: 'default'
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
    setAiSettings(state, action: PayloadAction<Partial<Pick<UiState, 'aiAvailable' | 'aiEnabled' | 'summaryLang' | 'researchLang' | 'allBudget'>>>) {
      const next = action.payload;
      if (typeof next.aiAvailable === 'boolean') state.aiAvailable = next.aiAvailable;
      if (typeof next.aiEnabled === 'boolean') state.aiEnabled = next.aiEnabled;
      if (next.summaryLang === 'bg' || next.summaryLang === 'en' || next.summaryLang === 'bilingual') state.summaryLang = next.summaryLang;
      if (next.researchLang === 'bg' || next.researchLang === 'en') state.researchLang = next.researchLang;
      if (next.allBudget === 'mixed' || next.allBudget === 'low' || next.allBudget === 'standard' || next.allBudget === 'high') state.allBudget = next.allBudget;
    },
    setAppearanceSettings(state, action: PayloadAction<Partial<Pick<UiState, 'font' | 'fontSize' | 'scheme' | 'buttonMode' | 'vibe' | 'colorMode'>>>) {
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
      if (next.buttonMode === 'icons' || next.buttonMode === 'text') {
        state.buttonMode = next.buttonMode;
      }
      if (next.colorMode === 'system' || next.colorMode === 'dark' || next.colorMode === 'light') {
        state.colorMode = next.colorMode;
      }
      if (typeof next.vibe === 'string' && isVibe(next.vibe)) state.vibe = next.vibe;
    },
    hydrateUiSettings(state, action: PayloadAction<Partial<Pick<UiState, 'language' | 'colorMode' | 'menuCollapsed' | 'controlsCollapsed' | 'searchVisible' | 'addStreamVisible' | 'allColumnControlsHidden' | 'notifyEnabled' | 'notifyMode' | 'font' | 'fontSize' | 'scheme' | 'buttonMode' | 'vibe'>>>) {
      const next = action.payload;
      if (next.language === 'en' || next.language === 'bg') state.language = next.language;
      if (next.colorMode === 'system' || next.colorMode === 'dark' || next.colorMode === 'light') state.colorMode = next.colorMode;
      if (typeof next.menuCollapsed === 'boolean') state.menuCollapsed = next.menuCollapsed;
      if (typeof next.controlsCollapsed === 'boolean') state.controlsCollapsed = next.controlsCollapsed;
      if (typeof next.searchVisible === 'boolean') state.searchVisible = next.searchVisible;
      if (typeof next.addStreamVisible === 'boolean') state.addStreamVisible = next.addStreamVisible;
      if (typeof next.allColumnControlsHidden === 'boolean') state.allColumnControlsHidden = next.allColumnControlsHidden;
      if (typeof next.notifyEnabled === 'boolean') state.notifyEnabled = next.notifyEnabled;
      if (next.notifyMode === 'matched' || next.notifyMode === 'matched_pinned' || next.notifyMode === 'pinned' || next.notifyMode === 'all') state.notifyMode = next.notifyMode;
      if (next.font === 'system' || next.font === 'manrope' || next.font === 'grotesk' || next.font === 'sora' || next.font === 'plex' || next.font === 'serif' || next.font === 'mono') state.font = next.font;
      if (next.fontSize === 'sm' || next.fontSize === 'md' || next.fontSize === 'lg' || next.fontSize === 'xl') state.fontSize = next.fontSize;
      if (next.scheme === 'classic' || next.scheme === 'vivid' || next.scheme === 'sunset' || next.scheme === 'neon' || next.scheme === 'ocean' || next.scheme === 'forest') state.scheme = next.scheme;
      if (next.buttonMode === 'icons' || next.buttonMode === 'text') state.buttonMode = next.buttonMode;
      if (typeof next.vibe === 'string' && isVibe(next.vibe)) state.vibe = next.vibe;
    }
  }
});

export const {
  setLanguage,
  setColorMode,
  setSearchQuery,
  setTopUiState,
  triggerHideAllResearch,
  setHelpOpen,
  setNotifySettings,
  setAiSettings,
  setAppearanceSettings,
  hydrateUiSettings
} = uiSlice.actions;
export default uiSlice.reducer;
