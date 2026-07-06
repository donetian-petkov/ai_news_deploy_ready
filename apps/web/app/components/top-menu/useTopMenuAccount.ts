'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TopMenuAiProvider } from './topMenu.services';
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
} from './topMenuAuth.services';

type MessageState = {
  kind: 'success' | 'error' | 'info';
  text: string;
} | null;

type Args = {
  provider: TopMenuAiProvider;
  labels: Record<string, string>;
  onSwitchProvider: (provider: TopMenuAiProvider) => void;
};

export function useTopMenuAccount({ provider, labels, onSwitchProvider }: Args) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const token = useMemo(() => getStoredAuthToken(), [user?.id]);

  const refreshUserAndKeyStatus = useCallback(async () => {
    const currentToken = getStoredAuthToken();
    if (!currentToken) {
      setUser(null);
      setHasSavedKey(false);
      return;
    }
    try {
      const me = await fetchCurrentUser(currentToken);
      setUser(me);
      const hasKey = await fetchProviderKeyStatus(currentToken, provider);
      setHasSavedKey(hasKey);
    } catch (error) {
      if (isUnauthorizedRequestError(error)) {
        clearStoredAuthToken();
        setUser(null);
        setHasSavedKey(false);
      }
    }
  }, [provider]);

  useEffect(() => {
    void refreshUserAndKeyStatus();
  }, [refreshUserAndKeyStatus]);

  useEffect(() => {
    const onAuthChanged = () => { void refreshUserAndKeyStatus(); };
    window.addEventListener('ai-news-auth-changed', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);
    return () => {
      window.removeEventListener('ai-news-auth-changed', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, [refreshUserAndKeyStatus]);

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
      window.dispatchEvent(new Event('ai-news-auth-changed'));
      setUser(result.user);
      setPassword('');
      const hasKey = await fetchProviderKeyStatus(result.token, provider);
      setHasSavedKey(hasKey);
      setMessage({
        kind: 'success',
        text: mode === 'register'
          ? (labels.authRegistered || 'Account created.')
          : (labels.authSignedIn || 'Signed in.')
      });
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error)?.message || (labels.authFailed || 'Authentication failed.') });
    } finally {
      setBusy(false);
    }
  }, [labels.authFailed, labels.authMissingCredentials, labels.authRegistered, labels.authSignedIn, password, provider, username]);

  const signOut = useCallback(() => {
    clearStoredAuthToken();
    window.dispatchEvent(new Event('ai-news-auth-changed'));
    setUser(null);
    setUsername('');
    setPassword('');
    setApiKey('');
    setHasSavedKey(false);
    setMessage({ kind: 'info', text: labels.authSignedOut || 'Signed out.' });
  }, [labels.authSignedOut]);

  const saveCurrentProviderKey = useCallback(async () => {
    if (!user) {
      setMessage({ kind: 'error', text: labels.authSignInRequired || 'Sign in is required.' });
      return;
    }
    const nextKey = String(apiKey || '').trim();
    if (!nextKey) {
      setMessage({ kind: 'error', text: labels.authKeyRequired || 'API key is required.' });
      return;
    }

    try {
      setBusy(true);
      await saveProviderKey(getStoredAuthToken(), provider, nextKey);
      setApiKey('');
      setHasSavedKey(true);
      onSwitchProvider(provider);
      setMessage({ kind: 'success', text: labels.authKeySavedAndApplied || labels.authKeySaved || 'API key saved and applied.' });
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error)?.message || (labels.authFailed || 'Request failed.') });
    } finally {
      setBusy(false);
    }
  }, [apiKey, labels.authFailed, labels.authKeyRequired, labels.authKeySaved, labels.authKeySavedAndApplied, labels.authSignInRequired, onSwitchProvider, provider, user]);

  const switchProviderWithSavedKey = useCallback((nextProvider: TopMenuAiProvider) => {
    if (!user) {
      setMessage({ kind: 'error', text: labels.authSignInRequired || 'Sign in is required.' });
      return;
    }
    onSwitchProvider(nextProvider);
    setMessage({ kind: 'info', text: labels.authProviderSwitchRequested || 'Provider switch requested.' });
  }, [labels.authProviderSwitchRequested, labels.authSignInRequired, onSwitchProvider, user]);

  return {
    user,
    username,
    setUsername,
    password,
    setPassword,
    apiKey,
    setApiKey,
    hasSavedKey,
    busy,
    message,
    token,
    signIn: () => submitAuth('login'),
    register: () => submitAuth('register'),
    signOut,
    saveCurrentProviderKey,
    switchProviderWithSavedKey
  };
}
