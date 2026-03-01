'use client';

import { memo } from 'react';
import { Card, CardContent } from '@mui/material';
import type { NewsCardProps } from './reactColumns.types';
import { NewsCardActions } from './news-card/NewsCardActions';
import { NewsCardAskPanel } from './news-card/NewsCardAskPanel';
import { NewsCardBody } from './news-card/NewsCardBody';
import { NewsCardHeader } from './news-card/NewsCardHeader';

export const NewsCard = memo(function NewsCard({
  item,
  askState,
  labels,
  vibeIcons,
  compactBtnSx,
  buttonMode,
  aiAvailable,
  performanceMode,
  fontScale,
  connected,
  hideAllResearch,
  hideAllSummaries,
  summaryPending,
  researchPending,
  isPinnedNews,
  accent,
  soft,
  matchAccent,
  showAutoResearching,
  summaryMode,
  summaryLong,
  summaryText,
  researchMode,
  researchLong,
  researchText,
  researchConfidence,
  onTogglePinnedNews,
  onCopyLink,
  onCopyNews,
  onHideItem,
  onRequestSummary,
  onRequestResearch,
  onToggleAsk,
  onSetSummaryMode,
  onSetResearchMode,
  onAskDraft,
  onAskSubmit
}: NewsCardProps) {
  const SummaryIconComp = vibeIcons.summary;
  const ResearchIconComp = vibeIcons.research;
  const AskIconComp = vibeIcons.ask;
  const ShareIconComp = vibeIcons.share;
  const HideIconComp = vibeIcons.hide;
  const CopyIconComp = vibeIcons.copy;

  const iconOnly = buttonMode === 'icons';
  const hasSummaryBlock = !!item.summary && !hideAllSummaries;
  const hasResearchBlock = !!item.research && !hideAllResearch;
  const hasBodyBlock = hasSummaryBlock || hasResearchBlock;
  const researchVisible = researchMode !== 'hidden';
  const researchToggleActive = hasResearchBlock && researchVisible;

  const actionSx = {
    ...compactBtnSx,
    minWidth: iconOnly ? 36 : 86,
    px: iconOnly ? 0.85 : 1.2,
    borderRadius: performanceMode ? 1.2 : 999,
    color: accent,
    borderColor: accent,
    '&:hover': {
      borderColor: accent,
      backgroundColor: soft
    },
    '&.MuiButton-contained': {
      color: 'rgba(230, 239, 255, 0.98)',
      border: `1px solid ${accent}`,
      backgroundColor: soft
    }
  };

  const matchActionSx = {
    ...actionSx,
    color: matchAccent,
    borderColor: matchAccent,
    '&:hover': {
      borderColor: matchAccent,
      backgroundColor: 'rgba(255, 168, 42, 0.16)'
    },
    '&.MuiButton-contained': {
      color: 'rgba(255, 226, 179, 0.98)',
      border: `1px solid ${matchAccent}`,
      backgroundColor: 'rgba(255, 168, 42, 0.2)'
    }
  };

  return (
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
          ? 'rgba(8, 14, 29, 0.98)'
          : `linear-gradient(155deg, rgba(5, 12, 25, 0.92), rgba(7, 14, 28, 0.86)), radial-gradient(550px 180px at 0% 0%, ${soft}, transparent 72%), var(--news-card-overlay)`,
        borderColor: item.isMatch ? matchAccent : `${accent}88`,
        color: 'rgba(234, 242, 255, 0.96)',
        contentVisibility: 'auto',
        containIntrinsicSize: '360px',
        borderRadius: 'var(--news-card-radius, 14px)',
        boxShadow: performanceMode ? 'none' : '0 10px 20px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.03)'
      }}
    >
      <CardContent sx={{ pb: '12px !important' }}>
        <NewsCardHeader
          item={item}
          labels={labels}
          iconOnly={iconOnly}
          actionSx={actionSx}
          matchActionSx={matchActionSx}
          accent={accent}
          matchAccent={matchAccent}
          fontScale={fontScale}
          connected={connected}
          isPinnedNews={isPinnedNews}
          hasBodyBlock={hasBodyBlock}
          performanceMode={performanceMode}
          ShareIconComp={ShareIconComp}
          CopyIconComp={CopyIconComp}
          HideIconComp={HideIconComp}
          onTogglePinnedNews={onTogglePinnedNews}
          onCopyLink={onCopyLink}
          onCopyNews={onCopyNews}
          onHideItem={onHideItem}
        />

        <NewsCardBody
          item={item}
          labels={labels}
          fontScale={fontScale}
          accent={accent}
          hideAllSummaries={hideAllSummaries}
          hideAllResearch={hideAllResearch}
          showAutoResearching={showAutoResearching}
          performanceMode={performanceMode}
          summaryMode={summaryMode}
          summaryLong={summaryLong}
          summaryText={summaryText}
          researchMode={researchMode}
          researchLong={researchLong}
          researchText={researchText}
          researchConfidence={researchConfidence}
          onSetSummaryMode={onSetSummaryMode}
          onSetResearchMode={onSetResearchMode}
        />

        <NewsCardActions
          item={item}
          askState={askState}
          labels={labels}
          iconOnly={iconOnly}
          actionSx={actionSx}
          matchActionSx={matchActionSx}
          accent={accent}
          aiAvailable={aiAvailable}
          connected={connected}
          summaryPending={summaryPending}
          researchPending={researchPending}
          summaryMode={summaryMode}
          summaryLong={summaryLong}
          researchMode={researchMode}
          researchLong={researchLong}
          hasSummaryBlock={hasSummaryBlock}
          hasResearchBlock={hasResearchBlock}
          researchToggleActive={researchToggleActive}
          SummaryIconComp={SummaryIconComp}
          ResearchIconComp={ResearchIconComp}
          AskIconComp={AskIconComp}
          onRequestSummary={onRequestSummary}
          onRequestResearch={onRequestResearch}
          onToggleAsk={onToggleAsk}
          onSetSummaryMode={onSetSummaryMode}
          onSetResearchMode={onSetResearchMode}
        />

        <NewsCardAskPanel
          item={item}
          askState={askState}
          labels={labels}
          aiAvailable={aiAvailable}
          performanceMode={performanceMode}
          connected={connected}
          onAskDraft={onAskDraft}
          onAskSubmit={onAskSubmit}
        />
      </CardContent>
    </Card>
  );
}, (prev, next) => {
  return prev.item === next.item
    && prev.askState === next.askState
    && prev.labels === next.labels
    && prev.vibeIcons === next.vibeIcons
    && prev.compactBtnSx === next.compactBtnSx
    && prev.buttonMode === next.buttonMode
    && prev.aiAvailable === next.aiAvailable
    && prev.performanceMode === next.performanceMode
    && prev.fontScale === next.fontScale
    && prev.connected === next.connected
    && prev.hideAllResearch === next.hideAllResearch
    && prev.hideAllSummaries === next.hideAllSummaries
    && prev.summaryPending === next.summaryPending
    && prev.researchPending === next.researchPending
    && prev.isPinnedNews === next.isPinnedNews
    && prev.accent === next.accent
    && prev.soft === next.soft
    && prev.matchAccent === next.matchAccent
    && prev.showAutoResearching === next.showAutoResearching
    && prev.summaryMode === next.summaryMode
    && prev.summaryLong === next.summaryLong
    && prev.summaryText === next.summaryText
    && prev.researchMode === next.researchMode
    && prev.researchLong === next.researchLong
    && prev.researchText === next.researchText
    && prev.researchConfidence === next.researchConfidence;
});
