'use client';

import { useCallback } from 'react';
import type { TopMenuVibe } from './topMenu.services';
import type { TopMenuUiState } from './types';

type SoundKind = 'toggle' | 'success' | 'error';
type SoundThemeValue = 'vibe' | TopMenuVibe;

const SOUND_ROOT_FREQ: Record<TopMenuVibe, number> = {
  default: 330,
  anime: 512,
  arcade: 448,
  cinema: 296,
  newspaper: 264,
  cyberwitch: 388,
  fantasy: 352,
  scifi: 420
};

let sharedAudioContext: AudioContext | null = null;

function playSoundCue(theme: TopMenuVibe, kind: SoundKind) {
  if (typeof window === 'undefined') return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!sharedAudioContext) {
    sharedAudioContext = new AC();
  }
  const ctx = sharedAudioContext;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
  const root = SOUND_ROOT_FREQ[theme] ?? SOUND_ROOT_FREQ.default;
  const plan = kind === 'error'
    ? [0, -5, -10]
    : kind === 'success'
      ? [0, 4, 7]
      : [0, 2];
  const now = ctx.currentTime;
  plan.forEach((step, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === 'error' ? 'sawtooth' : 'triangle';
    osc.frequency.value = root * Math.pow(2, step / 12);
    gain.gain.setValueAtTime(0.0001, now + idx * 0.07);
    gain.gain.exponentialRampToValueAtTime(kind === 'toggle' ? 0.035 : 0.05, now + idx * 0.07 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + idx * 0.07);
    osc.stop(now + idx * 0.07 + 0.09);
  });
}

export function useTopMenuSound(ui: Pick<TopMenuUiState, 'performanceMode' | 'soundEnabled' | 'soundTheme' | 'vibe'>) {
  const resolvedSoundTheme: TopMenuVibe = (ui.soundTheme === 'vibe'
    ? ui.vibe
    : ui.soundTheme) as SoundThemeValue as TopMenuVibe;

  const triggerSoundCue = useCallback((kind: SoundKind) => {
    if (ui.performanceMode || !ui.soundEnabled) return;
    playSoundCue(resolvedSoundTheme, kind);
  }, [resolvedSoundTheme, ui.performanceMode, ui.soundEnabled]);

  return { triggerSoundCue };
}

