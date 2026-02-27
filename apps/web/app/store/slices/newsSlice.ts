import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { MAX_ITEMS_PER_COLUMN } from '../constants';
import type { NewsItem } from '../types';

type AskMessage = {
  q: string;
  a?: string;
  error?: string;
};

type AskItemState = {
  open: boolean;
  draft: string;
  pending: boolean;
  used: number;
  remaining: number;
  messages: AskMessage[];
};

type NewsState = {
  itemsByFeed: Record<string, NewsItem[]>;
  hiddenIds: string[];
  summaryPendingById: Record<string, true>;
  researchPendingById: Record<string, true>;
  askByItem: Record<string, AskItemState>;
};

const initialState: NewsState = {
  itemsByFeed: {},
  hiddenIds: [],
  summaryPendingById: {},
  researchPendingById: {},
  askByItem: {}
};

function askKey(id: string, feedUrl: string): string {
  return `${feedUrl}::${id}`;
}

function ensureAskState(state: NewsState, id: string, feedUrl: string): AskItemState {
  const k = askKey(id, feedUrl);
  if (!state.askByItem[k]) {
    state.askByItem[k] = {
      open: false,
      draft: '',
      pending: false,
      used: 0,
      remaining: 5,
      messages: []
    };
  }
  return state.askByItem[k];
}

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setHiddenIds(state, action: PayloadAction<string[]>) {
      state.hiddenIds = action.payload;
    },
    hideItemLocally(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (!id) return;
      if (!state.hiddenIds.includes(id)) state.hiddenIds.push(id);
      Object.keys(state.itemsByFeed).forEach(feedUrl => {
        state.itemsByFeed[feedUrl] = (state.itemsByFeed[feedUrl] || []).filter(it => it.id !== id);
      });
      delete state.summaryPendingById[id];
      delete state.researchPendingById[id];
    },
    removeOldItemsInFeed(state, action: PayloadAction<{ feedUrl: string; cutoffMs: number }>) {
      const { feedUrl, cutoffMs } = action.payload;
      const list = state.itemsByFeed[feedUrl];
      if (!Array.isArray(list)) return;
      state.itemsByFeed[feedUrl] = list.filter(it => !Number.isFinite(it.publishedMs) || it.publishedMs >= cutoffMs);
    },
    resetAllToNewestLimit(state, action: PayloadAction<number>) {
      const limit = Math.max(1, Math.min(50, Math.floor(action.payload || 10)));
      Object.keys(state.itemsByFeed).forEach(feedUrl => {
        const list = Array.isArray(state.itemsByFeed[feedUrl]) ? [...state.itemsByFeed[feedUrl]] : [];
        list.sort((a, b) => b.publishedMs - a.publishedMs);
        state.itemsByFeed[feedUrl] = list.slice(0, limit);
      });
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
    },
    toggleAskOpen(state, action: PayloadAction<{ id: string; feedUrl: string }>) {
      const a = ensureAskState(state, action.payload.id, action.payload.feedUrl);
      a.open = !a.open;
    },
    setAskDraft(state, action: PayloadAction<{ id: string; feedUrl: string; draft: string }>) {
      const a = ensureAskState(state, action.payload.id, action.payload.feedUrl);
      a.draft = action.payload.draft;
    },
    enqueueAskQuestion(state, action: PayloadAction<{ id: string; feedUrl: string; question: string }>) {
      const a = ensureAskState(state, action.payload.id, action.payload.feedUrl);
      a.open = true;
      a.pending = true;
      a.draft = '';
      a.messages.push({ q: action.payload.question });
      a.used = Math.min(5, a.used + 1);
      a.remaining = Math.max(0, 5 - a.used);
    },
    receiveAskReply(state, action: PayloadAction<{
      id: string;
      feedUrl: string;
      question?: string;
      answer?: string;
      error?: string;
      used?: number;
      remaining?: number;
    }>) {
      const { id, feedUrl, question, answer, error, used, remaining } = action.payload;
      const a = ensureAskState(state, id, feedUrl);
      a.pending = false;
      if (typeof used === 'number') a.used = Math.max(0, Math.min(5, Math.floor(used)));
      if (typeof remaining === 'number') a.remaining = Math.max(0, Math.min(5, Math.floor(remaining)));

      const q = String(question || '').trim();
      let idx = -1;
      if (q) {
        for (let i = a.messages.length - 1; i >= 0; i--) {
          if (a.messages[i].q === q && !a.messages[i].a && !a.messages[i].error) {
            idx = i;
            break;
          }
        }
      }

      const payload = {
        q: q || (a.messages[a.messages.length - 1]?.q || ''),
        a: answer ? String(answer) : undefined,
        error: error ? String(error) : undefined
      };

      if (idx >= 0) a.messages[idx] = payload;
      else a.messages.push(payload);
    }
  }
});

export const {
  setHiddenIds,
  hideItemLocally,
  removeOldItemsInFeed,
  resetAllToNewestLimit,
  upsertNewsItem,
  setSummaryPending,
  clearSummaryPending,
  clearSummaryForItem,
  setResearchPending,
  clearResearchPending,
  clearResearchForItem,
  toggleAskOpen,
  setAskDraft,
  enqueueAskQuestion,
  receiveAskReply
} = newsSlice.actions;

export default newsSlice.reducer;
