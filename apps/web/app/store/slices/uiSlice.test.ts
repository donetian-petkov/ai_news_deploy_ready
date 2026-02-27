import { describe, expect, it } from 'vitest';
import uiReducer, { setSearchQuery, setTopUiState, triggerHideAllResearch, setAppearanceSettings, setNotifySettings, setAiSettings, hydrateUiSettings, enqueueToast, dismissToast } from './uiSlice';

describe('uiSlice', () => {
  it('returns the initial state', () => {
    const state = uiReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({
      language: 'en',
      colorMode: 'system',
      searchQuery: '',
      menuCollapsed: false,
      controlsCollapsed: false,
      searchVisible: true,
      addStreamVisible: false,
      allColumnControlsHidden: false,
      hideAllResearchSeq: 0,
      hideAllResearch: false,
      hideAllSummaries: false,
      showMoreNewsAllSeq: 0,
      resetNewsShownAllSeq: 0,
      helpOpen: false,
      notifyEnabled: false,
      notifyMode: 'matched',
      aiAvailable: false,
      aiEnabled: false,
      aiProvider: 'openai',
      summaryLang: 'bilingual',
      researchLang: 'bg',
      allBudget: 'standard',
      font: 'system',
      fontSize: 'md',
      scheme: 'classic',
      performanceMode: false,
      buttonMode: 'icons',
      vibe: 'default',
      toasts: []
    });
  });

  it('sets search query and normalizes falsy payloads', () => {
    let state = uiReducer(undefined, setSearchQuery('mars'));
    expect(state.searchQuery).toBe('mars');

    state = uiReducer(state, setSearchQuery(undefined as unknown as string));
    expect(state.searchQuery).toBe('');
  });

  it('updates top UI state for valid values only', () => {
    let state = uiReducer(
      undefined,
      setTopUiState({
        menuCollapsed: true,
        controlsCollapsed: true,
        searchVisible: false,
        addStreamVisible: true,
        allColumnControlsHidden: true,
        vibe: 'anime'
      })
    );

    expect(state.menuCollapsed).toBe(true);
    expect(state.controlsCollapsed).toBe(true);
    expect(state.searchVisible).toBe(false);
    expect(state.addStreamVisible).toBe(true);
    expect(state.allColumnControlsHidden).toBe(true);
    expect(state.vibe).toBe('anime');

    state = uiReducer(state, setTopUiState({ vibe: 'not-a-vibe' as never }));
    expect(state.vibe).toBe('anime');
  });

  it('increments hide-all-research sequence', () => {
    let state = uiReducer(undefined, triggerHideAllResearch());
    expect(state.hideAllResearchSeq).toBe(1);

    state = uiReducer(state, triggerHideAllResearch());
    expect(state.hideAllResearchSeq).toBe(2);
  });

  it('updates appearance and notify settings', () => {
    let state = uiReducer(undefined, setAppearanceSettings({ font: 'sora', fontSize: 'lg', scheme: 'neon', performanceMode: true, buttonMode: 'text' }));
    expect(state.font).toBe('sora');
    expect(state.fontSize).toBe('lg');
    expect(state.scheme).toBe('neon');
    expect(state.performanceMode).toBe(true);
    expect(state.buttonMode).toBe('text');

    state = uiReducer(state, setNotifySettings({ notifyEnabled: true, notifyMode: 'all' }));
    expect(state.notifyEnabled).toBe(true);
    expect(state.notifyMode).toBe('all');
  });

  it('updates ai provider/settings and ignores invalid provider', () => {
    let state = uiReducer(undefined, setAiSettings({
      aiAvailable: true,
      aiEnabled: true,
      aiProvider: 'claude',
      summaryLang: 'bg',
      researchLang: 'en',
      allBudget: 'high'
    }));
    expect(state.aiAvailable).toBe(true);
    expect(state.aiEnabled).toBe(true);
    expect(state.aiProvider).toBe('claude');
    expect(state.summaryLang).toBe('bg');
    expect(state.researchLang).toBe('en');
    expect(state.allBudget).toBe('high');

    state = uiReducer(state, setAiSettings({ aiProvider: 'invalid-provider' as never }));
    expect(state.aiProvider).toBe('claude');
  });

  it('hydrates stored prefs for performance mode and ai-related visibility toggles', () => {
    const state = uiReducer(undefined, hydrateUiSettings({
      menuCollapsed: true,
      controlsCollapsed: true,
      searchVisible: false,
      addStreamVisible: true,
      hideAllResearch: true,
      hideAllSummaries: true,
      performanceMode: true,
      vibe: 'cyberwitch'
    }));
    expect(state.menuCollapsed).toBe(true);
    expect(state.controlsCollapsed).toBe(true);
    expect(state.searchVisible).toBe(false);
    expect(state.addStreamVisible).toBe(true);
    expect(state.hideAllResearch).toBe(true);
    expect(state.hideAllSummaries).toBe(true);
    expect(state.performanceMode).toBe(true);
    expect(state.vibe).toBe('cyberwitch');
  });

  it('enqueues and dismisses toasts with bounded list', () => {
    let state = uiReducer(undefined, { type: '@@INIT' });
    for (let i = 0; i < 10; i++) {
      state = uiReducer(state, enqueueToast({ kind: 'info', message: `toast-${i}` }));
    }
    expect(state.toasts).toHaveLength(8);
    const firstToastId = state.toasts[0]?.id;
    expect(firstToastId).toBeTruthy();

    state = uiReducer(state, dismissToast(firstToastId || ''));
    expect(state.toasts.some(t => t.id === firstToastId)).toBe(false);
  });
});
