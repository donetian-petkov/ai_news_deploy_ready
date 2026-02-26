import { describe, expect, it } from 'vitest';
import feedsReducer, {
  removeFeedLocally,
  setAllFeedControlsOpen,
  setFeedBudgetSetting,
  setFeedColumnSettings,
  setFeedDeleteAge,
  setFeedIntervalSetting,
  setFeeds,
  toggleFeedControls,
  togglePinned
} from './feedsSlice';
import type { FeedInfo } from '../types';

const makeFeed = (url: string, label = 'Feed'): FeedInfo => ({
  url,
  label,
  kind: 'rss',
  intervalSec: 60,
  summaryEnabled: true,
  researchEnabled: false,
  budget: 'standard',
  sortMode: 'newest',
  filters: {
    onlyMatches: false,
    onlyResearched: false,
    onlySummaries: false
  }
});

describe('feedsSlice', () => {
  it('setFeeds initializes maps and prunes stale feed keys', () => {
    const previous = {
      feeds: [makeFeed('https://old')],
      pinnedByUrl: { 'https://old': true },
      controlsOpenByUrl: { 'https://old': false },
      deleteAgeByUrl: { 'https://old': 'month' as const }
    };

    const next = feedsReducer(previous, setFeeds([makeFeed('https://new')]));

    expect(next.feeds).toHaveLength(1);
    expect(next.pinnedByUrl['https://old']).toBeUndefined();
    expect(next.controlsOpenByUrl['https://old']).toBeUndefined();
    expect(next.deleteAgeByUrl['https://old']).toBeUndefined();
    expect(next.controlsOpenByUrl['https://new']).toBe(true);
    expect(next.deleteAgeByUrl['https://new']).toBe('week');
  });

  it('toggles pinned and control visibility state', () => {
    let state = feedsReducer(undefined, setFeeds([makeFeed('https://a')]));

    state = feedsReducer(state, togglePinned('https://a'));
    expect(state.pinnedByUrl['https://a']).toBe(true);

    state = feedsReducer(state, togglePinned('https://a'));
    expect(state.pinnedByUrl['https://a']).toBe(false);

    state = feedsReducer(state, toggleFeedControls('https://a'));
    expect(state.controlsOpenByUrl['https://a']).toBe(false);

    state = feedsReducer(state, toggleFeedControls('https://missing'));
    expect(state.controlsOpenByUrl['https://missing']).toBe(false);
  });

  it('sets all feed controls open/closed', () => {
    let state = feedsReducer(undefined, setFeeds([makeFeed('https://a'), makeFeed('https://b')]));
    state = feedsReducer(state, setAllFeedControlsOpen(false));

    expect(state.controlsOpenByUrl['https://a']).toBe(false);
    expect(state.controlsOpenByUrl['https://b']).toBe(false);

    state = feedsReducer(state, setAllFeedControlsOpen(true));
    expect(state.controlsOpenByUrl['https://a']).toBe(true);
    expect(state.controlsOpenByUrl['https://b']).toBe(true);
  });

  it('updates feed settings and clamps interval values', () => {
    let state = feedsReducer(undefined, setFeeds([makeFeed('https://a')]));

    state = feedsReducer(state, setFeedBudgetSetting({ feedUrl: 'https://a', budget: 'high' }));
    expect(state.feeds[0].budget).toBe('high');

    state = feedsReducer(state, setFeedIntervalSetting({ feedUrl: 'https://a', intervalSec: 10 }));
    expect(state.feeds[0].intervalSec).toBe(20);

    state = feedsReducer(state, setFeedIntervalSetting({ feedUrl: 'https://a', intervalSec: 59.9 }));
    expect(state.feeds[0].intervalSec).toBe(59);

    state = feedsReducer(state, setFeedIntervalSetting({ feedUrl: 'https://a', intervalSec: 9999 }));
    expect(state.feeds[0].intervalSec).toBe(3600);

    state = feedsReducer(
      state,
      setFeedColumnSettings({
        feedUrl: 'https://a',
        sortMode: 'matched',
        filters: { onlyMatches: true }
      })
    );
    expect(state.feeds[0].sortMode).toBe('matched');
    expect(state.feeds[0].filters).toEqual({
      onlyMatches: true,
      onlyResearched: false,
      onlySummaries: false
    });
  });

  it('removes feed locally and clears local maps', () => {
    let state = feedsReducer(undefined, setFeeds([makeFeed('https://a')]));
    state = feedsReducer(state, togglePinned('https://a'));
    state = feedsReducer(state, setFeedDeleteAge({ feedUrl: 'https://a', age: 'year' }));

    state = feedsReducer(state, removeFeedLocally('https://a'));

    expect(state.feeds).toHaveLength(0);
    expect(state.pinnedByUrl['https://a']).toBeUndefined();
    expect(state.controlsOpenByUrl['https://a']).toBeUndefined();
    expect(state.deleteAgeByUrl['https://a']).toBeUndefined();
  });
});
