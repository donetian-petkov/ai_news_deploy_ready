import { describe, expect, it } from 'vitest';
import connectionReducer, { setStatus } from './connectionSlice';

describe('connectionSlice', () => {
  it('returns initial state', () => {
    const state = connectionReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({ connected: false, status: 'connecting' });
  });

  it('marks connected only for connected status', () => {
    let state = connectionReducer(undefined, setStatus('connected'));
    expect(state).toEqual({ connected: true, status: 'connected' });

    state = connectionReducer(state, setStatus('disconnected'));
    expect(state).toEqual({ connected: false, status: 'disconnected' });

    state = connectionReducer(state, setStatus('error'));
    expect(state).toEqual({ connected: false, status: 'error' });
  });
});
