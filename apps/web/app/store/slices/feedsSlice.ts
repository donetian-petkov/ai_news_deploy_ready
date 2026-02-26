import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FeedInfo } from '../types';

type FeedsState = {
  feeds: FeedInfo[];
};

const initialState: FeedsState = {
  feeds: []
};

const feedsSlice = createSlice({
  name: 'feeds',
  initialState,
  reducers: {
    setFeeds(state, action: PayloadAction<FeedInfo[]>) {
      state.feeds = action.payload;
    }
  }
});

export const { setFeeds } = feedsSlice.actions;
export default feedsSlice.reducer;
