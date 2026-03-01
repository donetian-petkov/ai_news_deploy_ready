'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent } from '@mui/material';
import { COLUMN_LAYOUT_TOKENS, COLUMN_STYLE_TOKENS, NEWS_CARD_COLOR_TOKENS } from './designTokens';
import { NewsCardActions } from './news-card/NewsCardActions';
import { NewsCardAskPanel } from './news-card/NewsCardAskPanel';
import { NewsCardBody } from './news-card/NewsCardBody';
import { NewsCardHeader } from './news-card/NewsCardHeader';
import { NewsCardProvider } from './news-card/context/NewsCardProvider';
import type { NewsCardProps } from './news-card/newsCard.types';

export const NewsCard = memo(function NewsCard({ view, state, handlers }: NewsCardProps) {
  const { item, summaryMode, researchMode } = state;
  const { hideAllResearch, hideAllSummaries, performanceMode, accent, soft, matchAccent } = view;

  const hasSummaryBlock = !!item.summary && !hideAllSummaries;
  const hasResearchBlock = !!item.research && !hideAllResearch;
  const hasBodyBlock = hasSummaryBlock || hasResearchBlock;
  const researchVisible = researchMode !== 'hidden';
  const researchToggleActive = hasResearchBlock && researchVisible;

  const iconOnly = view.buttonMode === 'icons';
  const actionSx = useMemo(
    () => ({
      ...view.compactBtnSx,
      minWidth: iconOnly ? COLUMN_LAYOUT_TOKENS.newsCardActionMinWidthIcon : COLUMN_LAYOUT_TOKENS.newsCardActionMinWidthText,
      px: iconOnly ? COLUMN_LAYOUT_TOKENS.newsCardActionPaddingXIcon : COLUMN_LAYOUT_TOKENS.newsCardActionPaddingXText,
      borderRadius: performanceMode ? COLUMN_LAYOUT_TOKENS.compactControlRadiusPerformance : COLUMN_LAYOUT_TOKENS.compactControlRadius,
      color: accent,
      borderColor: accent,
      '&:hover': {
        borderColor: accent,
        backgroundColor: soft
      },
      '&.MuiButton-contained': {
        color: NEWS_CARD_COLOR_TOKENS.actionContainedText,
        border: `1px solid ${accent}`,
        backgroundColor: soft
      }
    }),
    [accent, iconOnly, performanceMode, soft, view.compactBtnSx]
  );

  const matchActionSx = useMemo(
    () => ({
      ...actionSx,
      color: matchAccent,
      borderColor: matchAccent,
      '&:hover': {
        borderColor: matchAccent,
        backgroundColor: NEWS_CARD_COLOR_TOKENS.matchHoverBg
      },
      '&.MuiButton-contained': {
        color: NEWS_CARD_COLOR_TOKENS.matchContainedText,
        border: `1px solid ${matchAccent}`,
        backgroundColor: NEWS_CARD_COLOR_TOKENS.matchContainedBg
      }
    }),
    [actionSx, matchAccent]
  );

  const contextValue = useMemo(
    () => ({
      view,
      state,
      handlers,
      ui: {
        iconOnly,
        hasSummaryBlock,
        hasResearchBlock,
        hasBodyBlock,
        researchToggleActive,
        actionSx,
        matchActionSx,
        summaryVisible: summaryMode !== 'hidden',
        researchVisible
      }
    }),
    [actionSx, handlers, hasBodyBlock, hasResearchBlock, hasSummaryBlock, iconOnly, matchActionSx, researchToggleActive, researchMode, researchVisible, state, summaryMode, view]
  );

  return (
    <NewsCardProvider value={contextValue}>
      <Card
        className="news-item-card"
        data-match={item.isMatch ? '1' : '0'}
        variant="outlined"
        sx={{
          '--ornament-accent': item.isMatch ? matchAccent : accent,
          '--ornament-soft': soft,
          position: 'relative',
          overflow: 'hidden',
          background: performanceMode
            ? NEWS_CARD_COLOR_TOKENS.perfBackground
            : `linear-gradient(155deg, ${NEWS_CARD_COLOR_TOKENS.gradientStart}, ${NEWS_CARD_COLOR_TOKENS.gradientEnd}), radial-gradient(550px 180px at 0% 0%, ${soft}, transparent 72%), var(--news-card-overlay)`,
          borderColor: item.isMatch ? matchAccent : `${accent}88`,
          color: NEWS_CARD_COLOR_TOKENS.textMain,
          contentVisibility: 'auto',
          containIntrinsicSize: `${COLUMN_LAYOUT_TOKENS.newsCardIntrinsicHeightPx}px`,
          borderRadius: COLUMN_STYLE_TOKENS.newsCardRadius,
          boxShadow: performanceMode ? 'none' : `${COLUMN_STYLE_TOKENS.newsCardShadowOffset} ${NEWS_CARD_COLOR_TOKENS.shadowColor}, inset 0 1px 0 ${NEWS_CARD_COLOR_TOKENS.insetHighlight}`
        }}
      >
        <CardContent sx={{ pb: COLUMN_LAYOUT_TOKENS.cardContentPaddingBottom }}>
          <NewsCardHeader />
          <NewsCardBody />
          <NewsCardActions />
          <NewsCardAskPanel />
        </CardContent>
      </Card>
    </NewsCardProvider>
  );
}, (prev, next) => {
  return prev.view === next.view
    && prev.state === next.state
    && prev.handlers === next.handlers;
});
