'use client';

import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import type { NewsCardProps } from '../reactColumns.types';
import { NEWS_CARD_COLOR_TOKENS } from '../designTokens';

type Props = {
  item: NewsCardProps['item'];
  labels: NewsCardProps['labels'];
  fontScale: number;
  accent: string;
  hideAllSummaries: boolean;
  hideAllResearch: boolean;
  showAutoResearching: boolean;
  performanceMode: boolean;
  summaryMode: NewsCardProps['summaryMode'];
  summaryLong: boolean;
  summaryText: string;
  researchMode: NewsCardProps['researchMode'];
  researchLong: boolean;
  researchText: string;
  researchConfidence: string;
  onSetSummaryMode: NewsCardProps['onSetSummaryMode'];
  onSetResearchMode: NewsCardProps['onSetResearchMode'];
};

export function NewsCardBody({
  item,
  labels,
  fontScale,
  accent,
  hideAllSummaries,
  hideAllResearch,
  showAutoResearching,
  performanceMode,
  summaryMode,
  summaryLong,
  summaryText,
  researchMode,
  researchLong,
  researchText,
  researchConfidence,
  onSetSummaryMode,
  onSetResearchMode
}: Props) {
  const summaryVisible = !hideAllSummaries && summaryMode !== 'hidden';
  const researchVisible = researchMode !== 'hidden';
  const hasSummaryBlock = !!item.summary && !hideAllSummaries;
  const hasResearchBlock = !!item.research && !hideAllResearch;

  return (
    <>
      {hasSummaryBlock ? (
        <Box>
          {summaryVisible ? (
            <Typography
              variant="body2"
              sx={{
                fontSize: `${0.96 * fontScale}rem`,
                lineHeight: 1.52,
                color: NEWS_CARD_COLOR_TOKENS.summaryText,
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--news-body-font-family, var(--font-family))'
              }}
            >
              {summaryText}
            </Typography>
          ) : null}
          {summaryVisible && summaryLong ? (
            <Button
              size="small"
              variant="text"
              onClick={() => onSetSummaryMode(summaryMode === 'collapsed' ? 'expanded' : 'collapsed')}
              sx={{ mt: 0.35, color: accent, textTransform: 'none', fontWeight: 700 }}
            >
              {summaryMode === 'collapsed' ? labels.showMore : labels.showLess}
            </Button>
          ) : null}
        </Box>
      ) : null}

      {showAutoResearching ? (
        <Chip
          size="small"
          label={labels.autoResearching}
          icon={<CircularProgress size={11} color="inherit" />}
          variant="outlined"
          sx={{ mb: 0.9, color: NEWS_CARD_COLOR_TOKENS.autoResearchText, borderColor: NEWS_CARD_COLOR_TOKENS.autoResearchBorder }}
        />
      ) : null}

      {hasResearchBlock ? (
        <Box sx={{ mt: 1 }}>
          {researchVisible ? (
            <>
              {researchConfidence ? (
                <Typography variant="caption" sx={{ color: NEWS_CARD_COLOR_TOKENS.confidenceText, display: 'block', mb: 0.35 }}>
                  {labels.confidence}: {researchConfidence}
                </Typography>
              ) : null}
              <Typography
                variant="body2"
                sx={{
                  fontSize: `${0.98 * fontScale}rem`,
                  lineHeight: 1.52,
                  color: NEWS_CARD_COLOR_TOKENS.researchText,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--news-body-font-family, var(--font-family))'
                }}
              >
                {researchText}
              </Typography>
            </>
          ) : null}
          {researchVisible && researchLong ? (
            <Button
              size="small"
              variant="text"
              onClick={() => onSetResearchMode(researchMode === 'collapsed' ? 'expanded' : 'collapsed')}
              sx={{ mt: 0.35, color: accent, textTransform: 'none', fontWeight: 700 }}
            >
              {researchMode === 'collapsed' ? labels.showMore : labels.showLess}
            </Button>
          ) : null}
        </Box>
      ) : null}

      {(hasSummaryBlock || hasResearchBlock) ? (
        <Box
          sx={{
            mt: 1.2,
            pt: 0.95,
            borderTop: performanceMode
              ? `1px solid ${NEWS_CARD_COLOR_TOKENS.footerDividerSoft}`
              : `1px dashed ${NEWS_CARD_COLOR_TOKENS.footerDividerDashed}`
          }}
        />
      ) : null}
    </>
  );
}
