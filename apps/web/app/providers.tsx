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
      mode,
      primary: mode === 'dark' ? { main: '#4da3ff', light: '#97c8ff' } : { main: '#0e63d4', light: '#3f80db' },
      secondary: mode === 'dark' ? { main: '#31d4a5' } : { main: '#0c946e' },
      background: mode === 'dark'
        ? { default: '#050a17', paper: '#121c2e' }
        : { default: '#eef3ff', paper: '#ffffff' },
      text: mode === 'dark'
        ? { primary: '#eaf1ff', secondary: 'rgba(211,223,244,0.82)' }
        : { primary: '#132033', secondary: 'rgba(34,50,74,0.74)' }
    },
    typography: {
      fontFamily: fontFamilyByPreset[ui.font] || fontFamilyByPreset.system,
      fontSize: fontSizeByPreset[ui.fontSize] || 14
    },
    shape: {
      borderRadius: 12
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            letterSpacing: '0.01em',
            borderRadius: 999
          },
          sizeSmall: {
            padding: '5px 12px',
            fontSize: '0.86rem'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            borderRadius: 999
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: mode === 'dark' ? 'rgba(23, 36, 58, 0.6)' : 'rgba(255, 255, 255, 0.9)'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(2px)'
          }
        }
      }
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
