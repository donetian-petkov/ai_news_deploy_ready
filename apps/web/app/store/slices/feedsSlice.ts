import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BudgetMode, FeedInfo, SortMode } from '../types';

type FeedsState = {
  feeds: FeedInfo[];
  pinnedByUrl: Record<string, boolean>;
  controlsOpenByUrl: Record<string, boolean>;
};

const initialState: FeedsState = {
  feeds: [],
  pinnedByUrl: {},
  controlsOpenByUrl: {}
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

      nextFeeds.forEach(f => {
        if (typeof state.controlsOpenByUrl[f.url] !== 'boolean') {
          state.controlsOpenByUrl[f.url] = true;
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
    removeFeedLocally(state, action: PayloadAction<string>) {
      const feedUrl = action.payload;
      state.feeds = state.feeds.filter(f => f.url !== feedUrl);
      delete state.pinnedByUrl[feedUrl];
      delete state.controlsOpenByUrl[feedUrl];
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
  removeFeedLocally,
  setFeedSummarySetting,
  setFeedResearchSetting,
  setFeedBudgetSetting,
  setFeedColumnSettings
} = feedsSlice.actions;
export default feedsSlice.reducer;
