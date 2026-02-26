import { describe, expect, it } from 'vitest';
import aiUsageReducer, { setUsage } from './aiUsageSlice';

describe('aiUsageSlice', () => {
  it('returns initial state', () => {
    const state = aiUsageReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  });

  it('replaces token usage snapshot', () => {
    const state = aiUsageReducer(
      undefined,
      setUsage({ inputTokens: 111, outputTokens: 222, totalTokens: 333 })
    );
    expect(state).toEqual({ inputTokens: 111, outputTokens: 222, totalTokens: 333 });
  });
});
