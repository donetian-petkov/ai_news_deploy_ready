'use client';

import type { ElementType } from 'react';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Button, Chip, Stack, Tooltip } from '@mui/material';
import type { NewsCardProps } from '../reactColumns.types';
import { NEWS_CARD_COLOR_TOKENS } from '../designTokens';

type Props = {
  item: NewsCardProps['item'];
  askState: NewsCardProps['askState'];
  labels: NewsCardProps['labels'];
  iconOnly: boolean;
  actionSx: Record<string, unknown>;
  matchActionSx: Record<string, unknown>;
  aiAvailable: boolean;
  connected: boolean;
  summaryPending: boolean;
  researchPending: boolean;
  summaryMode: NewsCardProps['summaryMode'];
  summaryLong: boolean;
  researchMode: NewsCardProps['researchMode'];
  researchLong: boolean;
  hasSummaryBlock: boolean;
  hasResearchBlock: boolean;
  researchToggleActive: boolean;
  SummaryIconComp: ElementType;
  ResearchIconComp: ElementType;
  AskIconComp: ElementType;
  onRequestSummary: NewsCardProps['onRequestSummary'];
  onRequestResearch: NewsCardProps['onRequestResearch'];
  onToggleAsk: NewsCardProps['onToggleAsk'];
  onSetSummaryMode: NewsCardProps['onSetSummaryMode'];
  onSetResearchMode: NewsCardProps['onSetResearchMode'];
};

export function NewsCardActions({
  item,
  askState,
  labels,
  iconOnly,
  actionSx,
  matchActionSx,
  aiAvailable,
  connected,
  summaryPending,
  researchPending,
  summaryMode,
  summaryLong,
  researchMode,
  researchLong,
  hasSummaryBlock,
  hasResearchBlock,
  researchToggleActive,
  SummaryIconComp,
  ResearchIconComp,
  AskIconComp,
  onRequestSummary,
  onRequestResearch,
  onToggleAsk,
  onSetSummaryMode,
  onSetResearchMode
}: Props) {
  const summaryVisible = summaryMode !== 'hidden';
  const researchVisible = researchMode !== 'hidden';

  return (
    <Stack direction="row" spacing={0.8} sx={{ mt: 0.3 }} flexWrap="wrap">
      {aiAvailable ? (
        <>
          <Tooltip title={summaryPending ? labels.generatingSummary : labels.summary}>
            <Button
              size="small"
              variant={summaryPending ? 'contained' : 'outlined'}
              sx={actionSx}
              onClick={() => onRequestSummary(item)}
              disabled={!connected || summaryPending}
            >
              {iconOnly
                ? (summaryPending
                  ? <AutoFixHighIcon sx={{ fontSize: 15 }} className="spinAnim" aria-hidden />
                  : <SummaryIconComp sx={{ fontSize: 15 }} aria-hidden />)
                : (summaryPending ? labels.generatingSummary : labels.summary)}
            </Button>
          </Tooltip>
          <Tooltip title={researchPending ? labels.researching : (researchToggleActive ? labels.hideResearch : labels.research)}>
            <Button
              size="small"
              variant={researchPending ? 'contained' : (researchToggleActive ? 'contained' : 'outlined')}
              sx={researchToggleActive ? matchActionSx : actionSx}
              onClick={() => {
                if (researchToggleActive) {
                  onSetResearchMode('hidden');
                  return;
                }
                if (hasResearchBlock && !researchVisible) {
                  onSetResearchMode(researchLong ? 'collapsed' : 'expanded');
                  return;
                }
                onRequestResearch(item);
              }}
              disabled={!connected || researchPending}
            >
              {iconOnly
                ? (researchPending
                  ? <AutoFixHighIcon sx={{ fontSize: 15 }} className="spinAnim" aria-hidden />
                  : <ResearchIconComp sx={{ fontSize: 15 }} aria-hidden />)
                : (researchPending ? labels.researching : (researchToggleActive ? labels.hideResearch : labels.research))}
            </Button>
          </Tooltip>
          <Tooltip title={labels.askAgent}>
            <Button
              size="small"
              variant={askState.open ? 'contained' : 'outlined'}
              sx={actionSx}
              onClick={() => onToggleAsk(item.id, item.feedUrl)}
              disabled={!connected}
            >
              {iconOnly
                ? (askState.pending
                  ? <AutoFixHighIcon sx={{ fontSize: 15 }} className="spinAnim" aria-hidden />
                  : <AskIconComp sx={{ fontSize: 15 }} aria-hidden />)
                : labels.askAgent}
            </Button>
          </Tooltip>
        </>
      ) : (
        <Chip
          size="small"
          variant="outlined"
          label={labels.aiUnavailable}
          sx={{ color: NEWS_CARD_COLOR_TOKENS.aiUnavailableText, borderColor: NEWS_CARD_COLOR_TOKENS.aiUnavailableBorder }}
        />
      )}
      {hasSummaryBlock ? (
        <Tooltip title={summaryVisible ? labels.hideSummary : labels.showSummary}>
          <Button
            size="small"
            variant={summaryVisible ? 'contained' : 'outlined'}
            sx={summaryVisible ? matchActionSx : actionSx}
            onClick={() => onSetSummaryMode(summaryVisible ? 'hidden' : (summaryLong ? 'collapsed' : 'expanded'))}
          >
            {iconOnly ? <SummaryIconComp sx={{ fontSize: 15 }} aria-hidden /> : (summaryVisible ? labels.hideSummary : labels.showSummary)}
          </Button>
        </Tooltip>
      ) : null}
    </Stack>
  );
}
