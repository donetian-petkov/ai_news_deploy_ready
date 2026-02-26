import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MAX_ITEMS_PER_COLUMN } from '../constants';
import type { NewsItem } from '../types';

type NewsState = {
  itemsByFeed: Record<string, NewsItem[]>;
  hiddenIds: string[];
  summaryPendingById: Record<string, true>;
  researchPendingById: Record<string, true>;
};

const initialState: NewsState = {
  itemsByFeed: {},
  hiddenIds: [],
  summaryPendingById: {},
  researchPendingById: {}
};

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setHiddenIds(state, action: PayloadAction<string[]>) {
      state.hiddenIds = action.payload;
    },
    upsertNewsItem(state, action: PayloadAction<NewsItem>) {
      const item = action.payload;
      if (item.filteredOk === false) return;
      if (state.hiddenIds.includes(item.id)) return;

      const list = Array.isArray(state.itemsByFeed[item.feedUrl])
        ? [...state.itemsByFeed[item.feedUrl]]
        : [];
      const idx = list.findIndex(x => x.id === item.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...item };
      else list.push(item);

      list.sort((a, b) => b.publishedMs - a.publishedMs);
      state.itemsByFeed[item.feedUrl] = list.slice(0, MAX_ITEMS_PER_COLUMN);

      if (item.summary && item.summary.trim()) {
        delete state.summaryPendingById[item.id];
      }
      if (item.research && item.research.trim()) {
        delete state.researchPendingById[item.id];
      }
    },
    setSummaryPending(state, action: PayloadAction<string>) {
      state.summaryPendingById[action.payload] = true;
    },
    clearSummaryPending(state, action: PayloadAction<string>) {
      delete state.summaryPendingById[action.payload];
    },
    clearSummaryForItem(state, action: PayloadAction<{ id: string; feedUrl: string }>) {
      const { id, feedUrl } = action.payload;
      const list = Array.isArray(state.itemsByFeed[feedUrl]) ? [...state.itemsByFeed[feedUrl]] : [];
      const idx = list.findIndex(x => x.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], summary: '' };
        state.itemsByFeed[feedUrl] = list;
      }
    },
    setResearchPending(state, action: PayloadAction<string>) {
      state.researchPendingById[action.payload] = true;
    },
    clearResearchPending(state, action: PayloadAction<string>) {
      delete state.researchPendingById[action.payload];
    },
    clearResearchForItem(state, action: PayloadAction<{ id: string; feedUrl: string }>) {
      const { id, feedUrl } = action.payload;
      const list = Array.isArray(state.itemsByFeed[feedUrl]) ? [...state.itemsByFeed[feedUrl]] : [];
      const idx = list.findIndex(x => x.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], research: '' };
        state.itemsByFeed[feedUrl] = list;
      }
    }
  }
});

export const {
  setHiddenIds,
  upsertNewsItem,
  setSummaryPending,
  clearSummaryPending,
  clearSummaryForItem,
  setResearchPending,
  clearResearchPending,
  clearResearchForItem
} = newsSlice.actions;

export default newsSlice.reducer;
