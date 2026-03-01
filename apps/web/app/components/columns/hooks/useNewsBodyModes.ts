'use client';

import { useCallback, useState } from 'react';
import type { BodyMode } from '../reactColumns.types';

export function useNewsBodyModes() {
  const [bodyModes, setBodyModes] = useState<Record<string, BodyMode>>({});

  const getBodyMode = useCallback((key: string, text: string, threshold: number): BodyMode => {
    const saved = bodyModes[key];
    if (saved) return saved;
    return String(text || '').trim().length > threshold ? 'collapsed' : 'expanded';
  }, [bodyModes]);

  const getDefaultBodyMode = useCallback((text: string, threshold: number): BodyMode => (
    String(text || '').trim().length > threshold ? 'collapsed' : 'expanded'
  ), []);

  const setBodyMode = useCallback((key: string, mode: BodyMode) => {
    setBodyModes(prev => ({ ...prev, [key]: mode }));
  }, []);

  return {
    bodyModes,
    getBodyMode,
    getDefaultBodyMode,
    setBodyMode
  };
}

