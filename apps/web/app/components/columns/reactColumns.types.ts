import type { FeedInfo, NewsItem } from '../../store/types';

export type BodyMode = 'collapsed' | 'expanded' | 'hidden';
export type VibeValue = 'default' | 'anime' | 'arcade' | 'cinema' | 'newspaper' | 'cyberwitch' | 'fantasy' | 'scifi';
export type SchemeValue = 'classic' | 'vivid' | 'sunset' | 'neon' | 'ocean' | 'forest';
export type FeedFilterPreset =
  | 'all'
  | 'matches'
  | 'researched'
  | 'summaries'
  | 'matches_researched'
  | 'matches_summaries'
  | 'researched_summaries'
  | 'all_flags';

export type ColumnPalette = {
  a: string;
  b: string;
  m: string;
  aSoft: string;
  bSoft: string;
  mSoft: string;
};

export type AskCardState = {
  open: boolean;
  draft: string;
  pending: boolean;
  remaining: number;
  messages: Array<{ q: string; a?: string; error?: string }>;
};

export type CardLabels = {
  pinNews: string;
  unpinNews: string;
  match: string;
  shareLink: string;
  copyNews: string;
  hideNews: string;
  generatingSummary: string;
  summary: string;
  researching: string;
  research: string;
  askAgent: string;
  showSummary: string;
  hideSummary: string;
  showMore: string;
  showLess: string;
  aiUnavailable: string;
  autoResearching: string;
  confidence: string;
  showResearch: string;
  hideResearch: string;
  questionsLeft: string;
  askPlaceholder: string;
  thinking: string;
  send: string;
};

export type VibeIcons = {
  summary: React.ElementType;
  research: React.ElementType;
  ask: React.ElementType;
  share: React.ElementType;
  hide: React.ElementType;
  copy: React.ElementType;
};

export type NewsCardProps = {
  item: NewsItem;
  askState: AskCardState;
  labels: CardLabels;
  vibeIcons: VibeIcons;
  compactBtnSx: Record<string, unknown>;
  buttonMode: 'icons' | 'text';
  aiAvailable: boolean;
  performanceMode: boolean;
  fontScale: number;
  connected: boolean;
  hideAllResearch: boolean;
  hideAllSummaries: boolean;
  summaryPending: boolean;
  researchPending: boolean;
  isPinnedNews: boolean;
  accent: string;
  soft: string;
  matchAccent: string;
  showAutoResearching: boolean;
  summaryMode: BodyMode;
  summaryLong: boolean;
  summaryText: string;
  researchMode: BodyMode;
  researchLong: boolean;
  researchText: string;
  researchConfidence: string;
  onTogglePinnedNews: (id: string) => void;
  onCopyLink: (url: string) => void;
  onCopyNews: (it: NewsItem) => void;
  onHideItem: (it: NewsItem) => void;
  onRequestSummary: (it: NewsItem) => void;
  onRequestResearch: (it: NewsItem) => void;
  onToggleAsk: (id: string, feedUrl: string) => void;
  onSetSummaryMode: (mode: BodyMode) => void;
  onSetResearchMode: (mode: BodyMode) => void;
  onAskDraft: (id: string, feedUrl: string, draft: string) => void;
  onAskSubmit: (it: NewsItem) => void;
};

export type FeedFilters = FeedInfo['filters'];
