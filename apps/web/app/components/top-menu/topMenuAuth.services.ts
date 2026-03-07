'use client';

import type { TopMenuAiProvider } from './topMenu.services';

export type AuthUser = {
  id: number;
  username: string;
};

type AuthSuccess = {
  token: string;
  user: AuthUser;
};

const AUTH_TOKEN_KEY = 'ai_news_auth_token';

function trimTrailingSlash(url: string): string {
  return String(url || '').replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  const explicit = trimTrailingSlash(String(process.env.NEXT_PUBLIC_API_URL || ''));
  if (explicit) return explicit;

  const wsUrl = String(process.env.NEXT_PUBLIC_WS_URL || '').trim();
  if (wsUrl.startsWith('wss://')) return trimTrailingSlash(wsUrl.replace(/^wss:\/\//, 'https://'));
  if (wsUrl.startsWith('ws://')) return trimTrailingSlash(wsUrl.replace(/^ws:\/\//, 'http://'));
  return 'http://localhost:4000';
}

export function getStoredAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return String(window.localStorage.getItem(AUTH_TOKEN_KEY) || '').trim();
}

export function setStoredAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  const value = String(token || '').trim();
  if (!value) return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, value);
}

export function clearStoredAuthToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function requestJson<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  const authToken = String(token || '').trim();
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers
  });

  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const error = String(body?.error || `Request failed (${response.status})`);
    throw new Error(error);
  }

  return body as T;
}

export async function registerUser(username: string, password: string): Promise<AuthSuccess> {
  return requestJson<AuthSuccess>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function loginUser(username: string, password: string): Promise<AuthSuccess> {
  return requestJson<AuthSuccess>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const result = await requestJson<{ user: AuthUser }>('/api/auth/me', { method: 'GET' }, token);
  return result.user;
}

export async function saveProviderKey(token: string, provider: TopMenuAiProvider, apiKey: string): Promise<void> {
  await requestJson<{ saved: true }>('/api/auth/provider-key', {
    method: 'POST',
    body: JSON.stringify({ provider, apiKey })
  }, token);
}

export async function fetchProviderKeyStatus(token: string, provider: TopMenuAiProvider): Promise<boolean> {
  const result = await requestJson<{ hasKey: boolean }>(`/api/auth/provider-key/${provider}`, { method: 'GET' }, token);
  return !!result.hasKey;
}
