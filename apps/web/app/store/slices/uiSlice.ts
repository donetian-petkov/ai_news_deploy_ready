import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UiState = {
  language: 'en' | 'bg';
  colorMode: 'system' | 'dark' | 'light';
};

const initialState: UiState = {
  language: 'en',
  colorMode: 'system'
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
    }
  }
});

export const { setLanguage, setColorMode } = uiSlice.actions;
export default uiSlice.reducer;
