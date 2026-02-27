'use client';

import { useMemo } from 'react';
import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppSelector } from './store/hooks';

function MuiThemeBridge({ children }: { children: React.ReactNode }) {
  const ui = useAppSelector(s => s.ui);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const mode = ui.colorMode === 'system' ? (prefersDark ? 'dark' : 'light') : ui.colorMode;

  const fontFamilyByPreset: Record<string, string> = {
    system: "'Inter', 'Segoe UI', sans-serif",
    manrope: "'Manrope', 'Segoe UI', sans-serif",
    grotesk: "'Space Grotesk', 'Segoe UI', sans-serif",
    sora: "'Sora', 'Segoe UI', sans-serif",
    plex: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    serif: "'Cinzel', Georgia, serif",
    mono: "'IBM Plex Mono', 'SF Mono', monospace"
  };
  const fontSizeByPreset: Record<string, number> = {
    sm: 13,
    md: 14,
    lg: 15,
    xl: 16
  };

  const theme = useMemo(() => createTheme({
    palette: {
      mode
    },
    typography: {
      fontFamily: fontFamilyByPreset[ui.font] || fontFamilyByPreset.system,
      fontSize: fontSizeByPreset[ui.fontSize] || 14
    },
    shape: {
      borderRadius: 12
    }
  }), [mode, ui.font, ui.fontSize]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <MuiThemeBridge>{children}</MuiThemeBridge>
    </Provider>
  );
}
