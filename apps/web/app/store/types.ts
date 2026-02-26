export type FeedKind = 'rss' | 'reddit' | 'youtube';
export type BudgetMode = 'low' | 'standard' | 'high';
export type SortMode = 'newest' | 'oldest' | 'matched';

export type ColumnFilters = {
  onlyMatches: boolean;
  onlyResearched: boolean;
  onlySummaries: boolean;
};

export type FeedInfo = {
  url: string;
  label: string;
  kind: FeedKind;
  intervalSec: number;
  summaryEnabled: boolean;
  researchEnabled: boolean;
  budget: BudgetMode;
  sortMode: SortMode;
  filters: ColumnFilters;
};

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  publishedMs: number;
  feedUrl: string;
  isMatch: boolean;
  summary?: string;
  research?: string;
  filteredOk?: boolean;
};

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
