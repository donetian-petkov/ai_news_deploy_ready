'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { sendWsMessage } from '../store/wsClient';
import {
  clearStoredAuthToken,
  fetchCurrentUser,
  fetchProviderKeyStatus,
  getStoredAuthToken,
  isUnauthorizedRequestError,
  loginUser,
  registerUser,
  saveProviderKey,
  setStoredAuthToken,
  type AuthUser
} from './top-menu/topMenuAuth.services';

type MessageState = {
  kind: 'success' | 'error' | 'info';
  text: string;
} | null;

function emitAuthChanged() {
  window.dispatchEvent(new Event('ai-news-auth-changed'));
}

export function NewsAccessGate() {
  const { t } = useTranslation();
  const labels = useMemo(() => t('topMenu', { returnObjects: true }) as Record<string, string>, [t]);
  const aiProvider = useAppSelector(state => state.ui.aiProvider);
  const connected = useAppSelector(state => state.connection.connected);
  const isLocalProvider = aiProvider === 'local';

  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState<MessageState>(null);

  const unlockSentRef = useRef('');

  const refreshSession = useCallback(async () => {
    const token = getStoredAuthToken();
    if (!token) {
      setUser(null);
      setHasSavedKey(false);
      setChecking(false);
      return;
    }
    setChecking(true);
    try {
      const me = await fetchCurrentUser(token);
      const hasKey = isLocalProvider ? true : await fetchProviderKeyStatus(token, aiProvider);
      setUser(me);
      setHasSavedKey(hasKey);
    } catch (error) {
      if (isUnauthorizedRequestError(error)) {
        clearStoredAuthToken();
        emitAuthChanged();
        setUser(null);
        setHasSavedKey(false);
      }
    } finally {
      setChecking(false);
    }
  }, [aiProvider, isLocalProvider]);

  useEffect(() => {
    void refreshSession();
    const timer = window.setInterval(() => {
      void refreshSession();
    }, 3500);
    const onAuthChanged = () => { void refreshSession(); };
    window.addEventListener('ai-news-auth-changed', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('ai-news-auth-changed', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, [refreshSession]);

  const unlocked = !!user && (isLocalProvider || hasSavedKey);
  const hasStoredToken = !!getStoredAuthToken();
  const awaitingSessionRestore = !user && hasStoredToken;
  const gateSubtitle = !user
    ? (labels.accessGateSubtitle || 'News fetching starts only after account login and provider API key setup.')
    : isLocalProvider
      ? (labels.accessGateUnlockedLocal || 'You are signed in and using the local provider. Fetching should start now.')
      : hasSavedKey
      ? (labels.accessGateUnlocked || 'You are signed in and the provider key is saved. Fetching should start now.')
      : (labels.accessGateNeedKey || 'You are signed in. Save an API key for the selected provider to unlock fetching.');
  const authActionButtonSx = useMemo(
    () => ({
      whiteSpace: 'nowrap',
      minWidth: { xs: 'calc(50% - 4px)', sm: 120 },
      flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' }
    }),
    []
  );

  useEffect(() => {
    if (!connected) {
      unlockSentRef.current = '';
    }
  }, [connected]);

  useEffect(() => {
    if (!unlocked) {
      unlockSentRef.current = '';
      return;
    }
    if (!connected) return;

    const token = getStoredAuthToken();
    if (!token) return;
    const unlockKey = `${token}:${aiProvider}`;
    if (unlockSentRef.current === unlockKey) return;

    const tryUnlock = () => {
      const ok = sendWsMessage({ type: 'set_ai_provider', provider: aiProvider, authToken: token });
      if (!ok) return false;
      unlockSentRef.current = unlockKey;
      return true;
    };

    if (tryUnlock()) return;

    const timer = window.setInterval(() => {
      if (tryUnlock()) window.clearInterval(timer);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [aiProvider, connected, unlocked]);

  const submitAuth = useCallback(async (mode: 'login' | 'register') => {
    const u = String(username || '').trim().toLowerCase();
    const p = String(password || '').trim();
    if (!u || !p) {
      setMessage({ kind: 'error', text: labels.authMissingCredentials || 'Username and password are required.' });
      return;
    }

    try {
      setBusy(true);
      const result = mode === 'register'
        ? await registerUser(u, p)
        : await loginUser(u, p);
      setStoredAuthToken(result.token);
      emitAuthChanged();
      setPassword('');
      setMessage({
        kind: 'success',
        text: mode === 'register'
          ? (labels.authRegistered || 'Account created.')
          : (labels.authSignedIn || 'Signed in.')
      });
      await refreshSession();
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message || (labels.authFailed || 'Authentication failed.') });
    } finally {
      setBusy(false);
    }
  }, [labels.authFailed, labels.authMissingCredentials, labels.authRegistered, labels.authSignedIn, password, refreshSession, username]);

  const saveKeyForProvider = useCallback(async () => {
    if (!user) {
      setMessage({ kind: 'error', text: labels.authSignInRequired || 'Sign in is required.' });
      return;
    }
    const token = getStoredAuthToken();
    if (!token) {
      setMessage({ kind: 'error', text: labels.authSignInRequired || 'Sign in is required.' });
      return;
    }
    const key = String(apiKey || '').trim();
    if (!key) {
      setMessage({ kind: 'error', text: labels.authKeyRequired || 'API key is required.' });
      return;
    }

    try {
      setBusy(true);
      await saveProviderKey(token, aiProvider, key);
      setApiKey('');
      setMessage({ kind: 'success', text: labels.authKeySavedAndApplied || labels.authKeySaved || 'API key saved.' });
      emitAuthChanged();
      await refreshSession();
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message || (labels.authFailed || 'Request failed.') });
    } finally {
      setBusy(false);
    }
  }, [aiProvider, apiKey, labels.authFailed, labels.authKeyRequired, labels.authKeySaved, labels.authKeySavedAndApplied, labels.authSignInRequired, refreshSession, user]);

  const signOut = useCallback(() => {
    clearStoredAuthToken();
    emitAuthChanged();
    setUser(null);
    setHasSavedKey(false);
    setPassword('');
    setApiKey('');
    setMessage({ kind: 'info', text: labels.authSignedOut || 'Signed out.' });
  }, [labels.authSignedOut]);

  if (unlocked) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 25,
        background: 'rgba(2, 6, 18, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'start center',
        px: 1.5,
        pt: { xs: 1.5, md: 3 },
        pb: 2
      }}
    >
      <Card
        variant="outlined"
        sx={{
          width: 'min(760px, 100%)',
          borderColor: 'rgba(88, 149, 255, 0.45)',
          background: 'linear-gradient(180deg, rgba(8, 16, 33, 0.96), rgba(6, 12, 24, 0.98))',
          color: '#dcebff',
          boxShadow: '0 16px 38px rgba(0, 0, 0, 0.45)',
          '& .MuiTypography-root': {
            color: 'inherit'
          },
          '& .MuiChip-root': {
            color: '#dcebff',
            borderColor: 'rgba(120, 180, 255, 0.42)'
          }
        }}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#eaf3ff' }}>
              {labels.accessGateTitle || 'Sign in to unlock live news'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(219, 233, 255, 0.82)' }}>
              {gateSubtitle}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip size="small" label={`${labels.accessGateProvider || 'Provider'}: ${String(aiProvider || '').toUpperCase()}`} variant="outlined" />
              <Chip size="small" color={user ? 'success' : 'default'} label={user ? `${labels.authSignedInAs || 'Signed in as'}: ${user.username}` : (labels.authSignInRequired || 'Sign in is required.')} />
              <Chip size="small" color={isLocalProvider || hasSavedKey ? 'success' : 'default'} label={isLocalProvider ? (labels.authKeyStoredLocal || 'Local provider does not need a key.') : (hasSavedKey ? (labels.authKeyStoredYes || 'Saved key exists for selected provider.') : (labels.authKeyStoredNo || 'No saved key for selected provider.'))} />
            </Stack>

            {!user && !awaitingSessionRestore ? (
              <Stack spacing={1}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    size="small"
                    fullWidth
                    label={labels.authUsername || 'Username'}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={busy}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    type="password"
                    label={labels.authPassword || 'Password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={busy}
                  />
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" onClick={() => void submitAuth('login')} disabled={busy} sx={authActionButtonSx}>
                    {labels.authSignIn || 'Sign in'}
                  </Button>
                  <Button variant="outlined" onClick={() => void submitAuth('register')} disabled={busy} sx={authActionButtonSx}>
                    {labels.authRegister || 'Register'}
                  </Button>
                </Stack>
              </Stack>
            ) : user ? (
              <Stack spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  type="password"
                  label={labels.authApiKey || 'Provider API key'}
                  placeholder={labels.authApiKeyPlaceholder || 'Paste API key for selected provider'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  disabled={busy}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="contained"
                    onClick={() => void saveKeyForProvider()}
                    disabled={busy || !String(apiKey || '').trim()}
                    sx={authActionButtonSx}
                  >
                    {labels.authSaveKey || 'Save key'}
                  </Button>
                  <Button variant="outlined" onClick={signOut} disabled={busy} sx={authActionButtonSx}>
                    {labels.authSignOut || 'Sign out'}
                  </Button>
                </Stack>
              </Stack>
            ) : null}

            {awaitingSessionRestore ? (
              <Typography variant="body2" sx={{ color: 'rgba(219, 233, 255, 0.82)' }}>
                {labels.accessGateChecking || 'Checking account access...'}
              </Typography>
            ) : null}

            {checking && !awaitingSessionRestore ? (
              <Typography variant="caption" sx={{ color: 'rgba(219, 233, 255, 0.75)' }}>
                {labels.accessGateChecking || 'Checking account access...'}
              </Typography>
            ) : null}

            {message ? (
              <Alert severity={message.kind === 'error' ? 'error' : (message.kind === 'success' ? 'success' : 'info')} sx={{ py: 0 }}>
                {message.text}
              </Alert>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
