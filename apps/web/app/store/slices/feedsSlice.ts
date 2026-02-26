import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FeedInfo } from '../types';

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
    }
  }
});

export const { setFeeds, togglePinned, toggleFeedControls, removeFeedLocally } = feedsSlice.actions;
export default feedsSlice.reducer;
