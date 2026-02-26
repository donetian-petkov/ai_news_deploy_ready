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
    }
  }
});

export const { setLanguage, setColorMode, setSearchQuery, setTopUiState } = uiSlice.actions;
export default uiSlice.reducer;
