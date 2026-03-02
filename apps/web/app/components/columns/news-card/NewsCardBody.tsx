'use client';

import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import { NEWS_CARD_COLOR_TOKENS } from '../designTokens';
import { useNewsCardContext } from './context/NewsCardContext';

export function NewsCardBody() {
  const {
    view,
    state,
    handlers,
    ui
  } = useNewsCardContext();

  const {
    labels,
    fontScale,
    accent,
    hideAllSummaries,
    hideAllResearch,
    performanceMode
  } = view;

  const {
    item,
    showAutoResearching,
    summaryPending,
    researchPending,
    summaryMode,
    summaryLong,
    summaryText,
    researchMode,
    researchLong,
    researchText,
    researchConfidence
  } = state;

  const { onSetSummaryMode, onSetResearchMode } = handlers;
  const { hasSummaryBlock, hasResearchBlock, summaryVisible, researchVisible } = ui;

  return (
    <>
      {summaryPending ? (
        <Chip
          size="small"
          label={labels.generatingSummary}
          icon={<CircularProgress size={11} color="inherit" />}
          variant="outlined"
          sx={{ mb: 0.8, color: NEWS_CARD_COLOR_TOKENS.summaryPendingText, borderColor: NEWS_CARD_COLOR_TOKENS.summaryPendingBorder }}
        />
      ) : null}

      {researchPending ? (
        <Chip
          size="small"
          label={labels.researching}
          icon={<CircularProgress size={11} color="inherit" />}
          variant="outlined"
          sx={{ mb: 0.8, color: NEWS_CARD_COLOR_TOKENS.researchPendingText, borderColor: NEWS_CARD_COLOR_TOKENS.researchPendingBorder }}
        />
      ) : null}

      {hasSummaryBlock ? (
        <Box>
          {summaryVisible && !hideAllSummaries ? (
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

      {hasResearchBlock && !hideAllResearch ? (
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
