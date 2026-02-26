import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BudgetMode, FeedInfo, SortMode } from '../types';

type FeedsState = {
  feeds: FeedInfo[];
  pinnedByUrl: Record<string, boolean>;
  controlsOpenByUrl: Record<string, boolean>;
  deleteAgeByUrl: Record<string, 'yesterday' | 'week' | 'month' | 'year'>;
};

const initialState: FeedsState = {
  feeds: [],
  pinnedByUrl: {},
  controlsOpenByUrl: {},
  deleteAgeByUrl: {}
};

const feedsSlice = createSlice({
  name: 'feeds',
  initialState,
  reducers: {
    setFeeds(state, action: PayloadAction<FeedInfo[]>) {
      const nextFeeds = action.payload;
      const nextUrls = new Set(nextFeeds.map(f => f.url));
      state.feeds = nextFeeds;

      Object.keys(state.pinnedByUrl).forEach(url => {
        if (!nextUrls.has(url)) delete state.pinnedByUrl[url];
      });
      Object.keys(state.controlsOpenByUrl).forEach(url => {
        if (!nextUrls.has(url)) delete state.controlsOpenByUrl[url];
      });
      Object.keys(state.deleteAgeByUrl).forEach(url => {
        if (!nextUrls.has(url)) delete state.deleteAgeByUrl[url];
      });

      nextFeeds.forEach(f => {
        if (typeof state.controlsOpenByUrl[f.url] !== 'boolean') {
          state.controlsOpenByUrl[f.url] = true;
        }
        if (!state.deleteAgeByUrl[f.url]) {
          state.deleteAgeByUrl[f.url] = 'week';
        }
      });
    },
    togglePinned(state, action: PayloadAction<string>) {
      const feedUrl = action.payload;
      state.pinnedByUrl[feedUrl] = !state.pinnedByUrl[feedUrl];
    },
    toggleFeedControls(state, action: PayloadAction<string>) {
      const feedUrl = action.payload;
      const current = state.controlsOpenByUrl[feedUrl];
      state.controlsOpenByUrl[feedUrl] = typeof current === 'boolean' ? !current : false;
    },
    setAllFeedControlsOpen(state, action: PayloadAction<boolean>) {
      const open = !!action.payload;
      state.feeds.forEach(f => {
        state.controlsOpenByUrl[f.url] = open;
      });
    },
    removeFeedLocally(state, action: PayloadAction<string>) {
      const feedUrl = action.payload;
      state.feeds = state.feeds.filter(f => f.url !== feedUrl);
      delete state.pinnedByUrl[feedUrl];
      delete state.controlsOpenByUrl[feedUrl];
      delete state.deleteAgeByUrl[feedUrl];
    },
    setFeedDeleteAge(state, action: PayloadAction<{ feedUrl: string; age: 'yesterday' | 'week' | 'month' | 'year' }>) {
      const { feedUrl, age } = action.payload;
      state.deleteAgeByUrl[feedUrl] = age;
    },
    setFeedSummarySetting(state, action: PayloadAction<{ feedUrl: string; enabled: boolean }>) {
      const idx = state.feeds.findIndex(f => f.url === action.payload.feedUrl);
      if (idx < 0) return;
      state.feeds[idx].summaryEnabled = action.payload.enabled;
    },
    setFeedResearchSetting(state, action: PayloadAction<{ feedUrl: string; enabled: boolean }>) {
      const idx = state.feeds.findIndex(f => f.url === action.payload.feedUrl);
      if (idx < 0) return;
      state.feeds[idx].researchEnabled = action.payload.enabled;
    },
    setFeedBudgetSetting(state, action: PayloadAction<{ feedUrl: string; budget: BudgetMode }>) {
      const idx = state.feeds.findIndex(f => f.url === action.payload.feedUrl);
      if (idx < 0) return;
      state.feeds[idx].budget = action.payload.budget;
    },
    setFeedIntervalSetting(state, action: PayloadAction<{ feedUrl: string; intervalSec: number }>) {
      const idx = state.feeds.findIndex(f => f.url === action.payload.feedUrl);
      if (idx < 0) return;
      state.feeds[idx].intervalSec = Math.max(20, Math.min(3600, Math.floor(action.payload.intervalSec)));
    },
    setFeedColumnSettings(state, action: PayloadAction<{
      feedUrl: string;
      sortMode?: SortMode;
      filters?: Partial<FeedInfo['filters']>;
    }>) {
      const idx = state.feeds.findIndex(f => f.url === action.payload.feedUrl);
      if (idx < 0) return;
      if (action.payload.sortMode) {
        state.feeds[idx].sortMode = action.payload.sortMode;
      }
      if (action.payload.filters) {
        state.feeds[idx].filters = {
          ...state.feeds[idx].filters,
          ...action.payload.filters
        };
      }
    }
  }
});

export const {
  setFeeds,
  togglePinned,
  toggleFeedControls,
  setAllFeedControlsOpen,
  removeFeedLocally,
  setFeedDeleteAge,
  setFeedSummarySetting,
  setFeedResearchSetting,
  setFeedBudgetSetting,
  setFeedIntervalSetting,
  setFeedColumnSettings
} = feedsSlice.actions;
export default feedsSlice.reducer;
