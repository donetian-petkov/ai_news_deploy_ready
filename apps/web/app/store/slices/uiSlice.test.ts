import { describe, expect, it } from 'vitest';
import uiReducer, { setSearchQuery, setTopUiState, triggerHideAllResearch, setAppearanceSettings, setNotifySettings } from './uiSlice';

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
      helpOpen: false,
      notifyEnabled: false,
      notifyMode: 'matched',
      aiAvailable: false,
      aiEnabled: false,
      summaryLang: 'bilingual',
      researchLang: 'bg',
      allBudget: 'standard',
      font: 'system',
      fontSize: 'md',
      scheme: 'classic',
      buttonMode: 'icons',
      vibe: 'default'
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
    let state = uiReducer(undefined, setAppearanceSettings({ font: 'sora', fontSize: 'lg', scheme: 'neon', buttonMode: 'text' }));
    expect(state.font).toBe('sora');
    expect(state.fontSize).toBe('lg');
    expect(state.scheme).toBe('neon');
    expect(state.buttonMode).toBe('text');

    state = uiReducer(state, setNotifySettings({ notifyEnabled: true, notifyMode: 'all' }));
    expect(state.notifyEnabled).toBe(true);
    expect(state.notifyMode).toBe('all');
  });
});
