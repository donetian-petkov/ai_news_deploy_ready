'use client';

import { memo } from 'react';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PushPinIcon from '@mui/icons-material/PushPin';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Link as MuiLink,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import type { NewsCardProps } from './reactColumns.types';
import { formatTime } from './reactColumns.utils';

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
  const summaryVisible = !hideAllSummaries && summaryMode !== 'hidden';
  const researchVisible = researchMode !== 'hidden';
  const hasSummaryBlock = !!item.summary && !hideAllSummaries;
  const hasResearchBlock = !!item.research && !hideAllResearch;
  const hasBodyBlock = hasSummaryBlock || hasResearchBlock;
  const SummaryIconComp = vibeIcons.summary;
  const ResearchIconComp = vibeIcons.research;
  const AskIconComp = vibeIcons.ask;
  const ShareIconComp = vibeIcons.share;
  const HideIconComp = vibeIcons.hide;
  const CopyIconComp = vibeIcons.copy;
  const iconOnly = buttonMode === 'icons';
  const showAiActions = aiAvailable;
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
      variant="outlined"
      sx={{
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.9 }}>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <Typography variant="caption" sx={{ color: 'rgba(210,219,235,0.74)' }}>
              {formatTime(item.publishedMs)}
            </Typography>
            {item.isMatch ? <Chip size="small" label={labels.match} variant="outlined" sx={{ color: matchAccent, borderColor: matchAccent, fontWeight: 800 }} /> : null}
          </Stack>
          <Stack direction="row" spacing={0.6} alignItems="center">
            <Tooltip title={isPinnedNews ? labels.unpinNews : labels.pinNews}>
              <Button
                size="small"
                variant={isPinnedNews ? 'contained' : 'outlined'}
                sx={{ ...actionSx, minWidth: 36, px: iconOnly ? 0.8 : 1.05 }}
                onClick={() => onTogglePinnedNews(item.id)}
              >
                <PushPinIcon sx={{ fontSize: 15 }} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip title={labels.shareLink}>
              <Button
                size="small"
                variant="outlined"
                sx={actionSx}
                onClick={() => onCopyLink(item.link)}
              >
                {iconOnly ? <ShareIconComp sx={{ fontSize: 15 }} aria-hidden /> : labels.shareLink}
              </Button>
            </Tooltip>
            <Tooltip title={labels.copyNews}>
              <Button
                size="small"
                variant="outlined"
                sx={actionSx}
                onClick={() => onCopyNews(item)}
              >
                {iconOnly ? <CopyIconComp sx={{ fontSize: 15 }} aria-hidden /> : labels.copyNews}
              </Button>
            </Tooltip>
            <Tooltip title={labels.hideNews}>
              <Button
                size="small"
                variant="outlined"
                sx={matchActionSx}
                onClick={() => onHideItem(item)}
                disabled={!connected}
              >
                {iconOnly ? <HideIconComp sx={{ fontSize: 15 }} aria-hidden /> : labels.hideNews}
              </Button>
            </Tooltip>
          </Stack>
        </Stack>

        <MuiLink
          href={item.link}
          target="_blank"
          rel="noreferrer"
          underline="hover"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            fontSize: `${1.12 * fontScale}rem`,
            lineHeight: 1.36,
            fontWeight: 800,
            color: 'primary.light',
            mb: 1.1,
            fontFamily: 'var(--news-title-font-family, var(--font-family))'
          }}
        >
          <span>{item.title}</span>
          <OpenInNewIcon sx={{ fontSize: 14 }} />
        </MuiLink>

        {hasBodyBlock ? <Box sx={{ borderTop: performanceMode ? '1px solid rgba(128, 154, 201, 0.22)' : '1px solid rgba(128, 154, 201, 0.34)', mb: 1.1 }} /> : null}

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
        <Stack
          direction="row"
          spacing={0.8}
          sx={hasBodyBlock
            ? { mt: 1.2, pt: 0.95, borderTop: performanceMode ? '1px solid rgba(124, 150, 193, 0.22)' : '1px dashed rgba(124, 150, 193, 0.3)' }
            : { mt: 0.5, pt: 0 }}
          flexWrap="wrap"
        >
          {showAiActions ? (
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
            <Chip size="small" variant="outlined" label={labels.aiUnavailable} sx={{ color: 'rgba(199,214,238,0.88)', borderColor: 'rgba(122,149,194,0.44)' }} />
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
        {askState.open && aiAvailable ? (
          <Box sx={{ mt: 1.1, p: 1, border: '1px solid rgba(106,128,162,0.4)', borderRadius: performanceMode ? 1 : 1.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
              <Typography variant="caption" sx={{ color: 'rgba(210,219,235,0.74)' }}>
                {labels.askAgent}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(188,203,229,0.75)' }}>
                {labels.questionsLeft}: {askState.remaining}
              </Typography>
            </Stack>
            <Stack spacing={0.8} sx={{ mb: 0.8, maxHeight: 180, overflow: 'auto' }}>
              {askState.messages.map((m, idx) => (
                <Box key={`${idx}-${m.q.slice(0, 18)}`}>
                  <Typography variant="caption" sx={{ color: 'rgba(146,204,255,0.92)', display: 'block' }}>
                    Q: {m.q}
                  </Typography>
                  <Typography variant="caption" sx={{ color: m.error ? 'rgba(255,168,168,0.95)' : 'rgba(216,227,246,0.92)', display: 'block' }}>
                    A: {m.error || m.a || '...'}
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                fullWidth
                placeholder={labels.askPlaceholder}
                value={askState.draft}
                onChange={e => onAskDraft(item.id, item.feedUrl, e.target.value.slice(0, 400))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAskSubmit(item);
                  }
                }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => onAskSubmit(item)}
                disabled={!connected || askState.pending || askState.remaining <= 0 || !String(askState.draft || '').trim()}
              >
                {askState.pending ? labels.thinking : labels.send}
              </Button>
            </Stack>
          </Box>
        ) : null}
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
