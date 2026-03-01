'use client';

import { useMemo } from 'react';
import { Alert, Button, Skeleton, Stack } from '@mui/material';
import type { FeedInfo, NewsItem } from '../../../store/types';
import type { BodyMode, FeedAskState } from '../reactColumns.types';
import { collapseText, compactResearch, extractConfidence } from '../reactColumns.utils';
import { NewsCard } from '../NewsCard';
import { useFeedColumnsContext } from '../context/FeedColumnsContext';
import { COLUMN_COLOR_TOKENS, COLUMN_LAYOUT_TOKENS } from '../designTokens';
import type { NewsCardHandlers, NewsCardStateModel, NewsCardViewModel } from '../news-card/newsCard.types';

type Props = {
  feed: FeedInfo;
  items: NewsItem[];
  itemsVisible: NewsItem[];
  shownItems: NewsItem[];
  isMatchColumn: boolean;
  accent: string;
  soft: string;
  isHydrated: boolean;
};

function askKey(it: NewsItem): string {
  return `${it.feedUrl}::${it.id}`;
}

function bodyKey(it: NewsItem, kind: 'summary' | 'research'): string {
  return `${it.feedUrl}::${it.id}::${kind}`;
}

function getDefaultAskState(): FeedAskState {
  return {
    open: false,
    draft: '',
    pending: false,
    remaining: 5,
    messages: []
  };
}

export function FeedColumnItemsList({
  feed,
  items,
  itemsVisible,
  shownItems,
  isMatchColumn,
  accent,
  soft,
  isHydrated
}: Props) {
  const { view, state, handlers } = useFeedColumnsContext();

  const {
    aiAvailable,
    aiEnabled,
    performanceMode,
    fontScale,
    buttonMode,
    compactBtnSx,
    labels,
    cardLabels,
    vibeIcons,
    hideAllResearch,
    hideAllSummaries,
    palette,
    connected
  } = view;

  const {
    summaryPendingById,
    researchPendingById,
    pinnedNewsById,
    askByItem,
    bodyModes
  } = state;

  const {
    getBodyMode,
    getDefaultBodyMode,
    setBodyMode,
    onTogglePinnedNews,
    onCopyLink,
    onCopyNewsPayload,
    onHideItem,
    onRequestSummary,
    onRequestResearch,
    onToggleAsk,
    onSetAskDraft,
    onAskSubmit,
    onShowMoreNews,
    onResetNewsToTen
  } = handlers;

  const sharedCardView = useMemo<NewsCardViewModel>(() => ({
    labels: cardLabels,
    vibeIcons,
    compactBtnSx,
    buttonMode,
    aiAvailable,
    performanceMode,
    fontScale,
    connected,
    hideAllResearch,
    hideAllSummaries,
    accent,
    soft,
    matchAccent: palette.m
  }), [accent, aiAvailable, buttonMode, cardLabels, compactBtnSx, connected, fontScale, hideAllResearch, hideAllSummaries, palette.m, performanceMode, soft, vibeIcons]);

  const sharedCardHandlers = useMemo<NewsCardHandlers>(() => ({
    onTogglePinnedNews,
    onCopyLink,
    onCopyNews: onCopyNewsPayload,
    onHideItem,
    onRequestSummary,
    onRequestResearch,
    onToggleAsk,
    onAskDraft: onSetAskDraft,
    onAskSubmit,
    onSetSummaryMode: () => {},
    onSetResearchMode: () => {}
  }), [onAskSubmit, onCopyLink, onCopyNewsPayload, onHideItem, onRequestResearch, onRequestSummary, onSetAskDraft, onToggleAsk, onTogglePinnedNews]);

  if (!isHydrated) {
    return (
      <Stack spacing={1.2} sx={{ py: 0.6 }}>
        <Skeleton variant="rounded" height={80} sx={{ bgcolor: COLUMN_COLOR_TOKENS.skeletonBg }} />
        <Skeleton variant="rounded" height={80} sx={{ bgcolor: COLUMN_COLOR_TOKENS.skeletonBg }} />
        <Alert severity="info" variant="outlined">Loading column...</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.2}>
      {itemsVisible.length === 0 ? (
        <Alert severity="info" variant="outlined">
          {items.length === 0 ? (isMatchColumn ? labels.waitingMatches : labels.waiting) : labels.noMatches}
        </Alert>
      ) : shownItems.map(it => {
        const askState: FeedAskState = askByItem[askKey(it)] || getDefaultAskState();
        const summaryKey = bodyKey(it, 'summary');
        const researchKey = bodyKey(it, 'research');
        const summaryResearchHidden = hideAllResearch || bodyModes[researchKey] === 'hidden';
        const savedSummaryMode = bodyModes[summaryKey];
        const summaryMode = summaryResearchHidden && savedSummaryMode === 'hidden'
          ? getDefaultBodyMode(it.summary || '', COLUMN_LAYOUT_TOKENS.summaryCollapseThreshold)
          : getBodyMode(summaryKey, it.summary || '', COLUMN_LAYOUT_TOKENS.summaryCollapseThreshold);

        const summaryLong = String(it.summary || '').trim().length > COLUMN_LAYOUT_TOKENS.summaryCollapseThreshold;
        const summaryText = summaryMode === 'collapsed'
          ? collapseText(it.summary || '', COLUMN_LAYOUT_TOKENS.summaryCollapseThreshold)
          : String(it.summary || '');

        const researchMode = getBodyMode(researchKey, it.research || '', COLUMN_LAYOUT_TOKENS.researchCollapseThreshold);
        const researchLong = String(it.research || '').trim().length > COLUMN_LAYOUT_TOKENS.researchCollapseThreshold;
        const researchText = researchMode === 'collapsed'
          ? compactResearch(it.research || '')
          : String(it.research || '');

        const cardState: NewsCardStateModel = {
          item: it,
          askState,
          summaryPending: !!summaryPendingById[it.id],
          researchPending: !!researchPendingById[it.id],
          isPinnedNews: !!pinnedNewsById[it.id],
          showAutoResearching: aiAvailable && feed.researchEnabled && aiEnabled && !it.research && !researchPendingById[it.id] && !hideAllResearch,
          summaryMode,
          summaryLong,
          summaryText,
          researchMode,
          researchLong,
          researchText,
          researchConfidence: extractConfidence(it.research || '')
        };

        const cardHandlers: NewsCardHandlers = {
          ...sharedCardHandlers,
          onSetSummaryMode: (mode: BodyMode) => setBodyMode(summaryKey, mode),
          onSetResearchMode: (mode: BodyMode) => setBodyMode(researchKey, mode)
        };

        return (
          <NewsCard
            key={it.id}
            view={sharedCardView}
            state={cardState}
            handlers={cardHandlers}
          />
        );
      })}
      {itemsVisible.length > shownItems.length ? (
        <Button
          size="small"
          variant="outlined"
          onClick={() => onShowMoreNews(feed.url)}
        >
          {labels.showFiveMore}
        </Button>
      ) : null}
      {itemsVisible.length > COLUMN_LAYOUT_TOKENS.initialVisibleItems && shownItems.length > COLUMN_LAYOUT_TOKENS.initialVisibleItems ? (
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => onResetNewsToTen(feed.url)}
        >
          {labels.resetToTenItems}
        </Button>
      ) : null}
    </Stack>
  );
}
