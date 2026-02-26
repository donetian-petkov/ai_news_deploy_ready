export type FeedKind = 'rss' | 'reddit' | 'youtube';

export type FeedInfo = {
  url: string;
  label: string;
  kind: FeedKind;
  intervalSec: number;
};

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  publishedMs: number;
  feedUrl: string;
  isMatch: boolean;
  summary?: string;
  filteredOk?: boolean;
};

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
