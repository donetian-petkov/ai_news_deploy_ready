import type { RootState } from '../../store/store';

export type TopMenuVibe = RootState['ui']['vibe'];
export type TopMenuColorMode = RootState['ui']['colorMode'];
export type TopMenuDeleteAge = 'yesterday' | 'week' | 'month' | 'year';
export type TopMenuAiProvider = RootState['ui']['aiProvider'];

export const VIBES: TopMenuVibe[] = ['default', 'anime', 'arcade', 'cinema', 'newspaper', 'cyberwitch', 'fantasy', 'scifi'];

const COLOR_MODE_ORDER: TopMenuColorMode[] = ['system', 'dark', 'light'];

export function getNextColorMode(current: TopMenuColorMode): TopMenuColorMode {
  const idx = COLOR_MODE_ORDER.indexOf(current);
  return COLOR_MODE_ORDER[(idx + 1) % COLOR_MODE_ORDER.length];
}

export function getNextVibe(current: TopMenuVibe): TopMenuVibe {
  const idx = VIBES.indexOf(current);
  return VIBES[(idx + 1) % VIBES.length];
}

export function cutoffFromAge(age: TopMenuDeleteAge, nowMs = Date.now()): number {
  if (age === 'yesterday') return nowMs - 24 * 60 * 60 * 1000;
  if (age === 'month') return nowMs - 30 * 24 * 60 * 60 * 1000;
  if (age === 'year') return nowMs - 365 * 24 * 60 * 60 * 1000;
  return nowMs - 7 * 24 * 60 * 60 * 1000;
}

export function getProviderKeyLabel(provider: TopMenuAiProvider): string {
  if (provider === 'claude') return 'ANTHROPIC_API_KEY';
  if (provider === 'openrouter') return 'OPENROUTER_API_KEY';
  return 'OPENAI_API_KEY';
}

