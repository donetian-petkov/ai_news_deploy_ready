'use client';

import { useEffect, useMemo } from 'react';
import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { store } from './store/store';
import { useAppSelector } from './store/hooks';
import { FontPresetValue, FontSizeValue, isFontPreset, isFontSize } from './store/valueEnums';
import i18n from './i18n';
import { FONT_FAMILY_BY_PRESET, FONT_SIZE_BY_PRESET } from './theme/themeTokens';

function MuiThemeBridge({ children }: { children: React.ReactNode }) {
  const ui = useAppSelector(s => s.ui);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const mode = ui.colorMode === 'system' ? (prefersDark ? 'dark' : 'light') : ui.colorMode;
  const fontPreset = isFontPreset(ui.font) ? ui.font : FontPresetValue.System;
  const fontSizePreset = isFontSize(ui.fontSize) ? ui.fontSize : FontSizeValue.Md;

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
      fontFamily: FONT_FAMILY_BY_PRESET[fontPreset],
      fontSize: FONT_SIZE_BY_PRESET[fontSizePreset]
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
          root: {}
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

function I18nBridge({ children }: { children: React.ReactNode }) {
  const language = useAppSelector(s => s.ui.language);

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <I18nBridge>
          <MuiThemeBridge>{children}</MuiThemeBridge>
        </I18nBridge>
      </I18nextProvider>
    </Provider>
  );
}
