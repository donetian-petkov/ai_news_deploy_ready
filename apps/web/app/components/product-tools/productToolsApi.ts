'use client';

export type ProductFeature = {
  id: number;
  kind: string;
  title: string;
  payload: Record<string, unknown>;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductToolMode = 'library' | 'history' | 'sources' | 'collections' | 'digests' | 'rules' | 'schedules' | 'import-export';

type RequestOptions = {
  method?: string;
  body?: unknown;
  accept?: 'json' | 'text';
};

const AUTH_TOKEN_KEY = 'ai_news_auth_token';

function trimTrailingSlash(url: string): string {
  return String(url || '').replace(/\/+$/, '');
}

export function getProductApiBaseUrl(): string {
  const explicit = trimTrailingSlash(String(process.env.NEXT_PUBLIC_API_URL || ''));
  if (explicit) return explicit;
  const wsUrl = String(process.env.NEXT_PUBLIC_WS_URL || '').trim();
  if (wsUrl.startsWith('wss://')) return trimTrailingSlash(wsUrl.replace(/^wss:\/\//, 'https://'));
  if (wsUrl.startsWith('ws://')) return trimTrailingSlash(wsUrl.replace(/^ws:\/\//, 'http://'));
  return 'http://localhost:4000';
}

export function getProductAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return String(window.localStorage.getItem(AUTH_TOKEN_KEY) || '').trim();
}

export async function productApiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getProductAuthToken();
  if (!token) throw new Error('Sign in first to use this tool.');
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  if (typeof options.body !== 'undefined') headers.set('Content-Type', 'application/json');
  const response = await fetch(`${getProductApiBaseUrl()}${path}`, {
    method: options.method || (typeof options.body === 'undefined' ? 'GET' : 'POST'),
    headers,
    body: typeof options.body === 'undefined' ? undefined : JSON.stringify(options.body)
  });
  const isText = options.accept === 'text';
  const body = isText ? await response.text() : await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body === 'object' && body && 'error' in body
      ? String((body as { error?: unknown }).error || 'Request failed')
      : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function publicApiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${getProductApiBaseUrl()}${path}`);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(String((body as { error?: unknown } | null)?.error || `Request failed (${response.status})`));
  }
  return body as T;
}

export function splitList(value: string) {
  return String(value || '')
    .split(/[,\n]+/g)
    .map(item => item.trim())
    .filter(Boolean);
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
