'use client';

import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import type { NewsCardProps } from '../reactColumns.types';

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
                color: 'rgba(226,234,250,0.96)',
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
          sx={{ mb: 0.9, color: 'rgba(152, 228, 255, 0.96)', borderColor: 'rgba(73,167,255,0.55)' }}
        />
      ) : null}

      {hasResearchBlock ? (
        <Box sx={{ mt: 1 }}>
          {researchVisible ? (
            <>
              {researchConfidence ? (
                <Typography variant="caption" sx={{ color: 'rgba(212,220,236,0.75)', display: 'block', mb: 0.35 }}>
                  {labels.confidence}: {researchConfidence}
                </Typography>
              ) : null}
              <Typography
                variant="body2"
                sx={{
                  fontSize: `${0.98 * fontScale}rem`,
                  lineHeight: 1.52,
                  color: 'rgba(205,218,238,0.93)',
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
        <Box sx={{ mt: 1.2, pt: 0.95, borderTop: performanceMode ? '1px solid rgba(124, 150, 193, 0.22)' : '1px dashed rgba(124, 150, 193, 0.3)' }} />
      ) : null}
    </>
  );
}
