'use client';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PushPinIcon from '@mui/icons-material/PushPin';
import { Box, Button, Chip, Link as MuiLink, Stack, Tooltip, Typography } from '@mui/material';
import { formatTime } from '../reactColumns.utils';
import { NEWS_CARD_COLOR_TOKENS } from '../designTokens';
import { useNewsCardContext } from './context/NewsCardContext';

export function NewsCardHeader() {
  const {
    view,
    state,
    handlers,
    ui
  } = useNewsCardContext();

  const { labels, vibeIcons, connected, fontScale, matchAccent } = view;
  const { item, isPinnedNews } = state;
  const { onTogglePinnedNews, onCopyLink, onCopyNews, onHideItem } = handlers;
  const { iconOnly, hasBodyBlock, actionSx, matchActionSx } = ui;

  const ShareIconComp = vibeIcons.share;
  const HideIconComp = vibeIcons.hide;
  const CopyIconComp = vibeIcons.copy;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.9, pt: 0.35, px: 0.8 }}>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <Typography variant="caption" sx={{ color: NEWS_CARD_COLOR_TOKENS.headerMuted }}>
            {formatTime(item.publishedMs)}
          </Typography>
          {item.isMatch ? <Chip size="small" label={labels.match} variant="outlined" sx={{ color: matchAccent, borderColor: matchAccent, fontWeight: 800 }} /> : null}
        </Stack>
        <Stack direction="row" spacing={0.6} alignItems="center" sx={{ pr: 0.2 }}>
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
          color: NEWS_CARD_COLOR_TOKENS.title,
          mb: 1.1,
          fontFamily: 'var(--news-title-font-family, var(--font-family))'
        }}
      >
        <span>{item.title}</span>
        <OpenInNewIcon sx={{ fontSize: 14 }} />
      </MuiLink>

      {hasBodyBlock ? (
        <Box
          sx={{
            borderTop: view.performanceMode
              ? `1px solid ${NEWS_CARD_COLOR_TOKENS.dividerSoft}`
              : `1px solid ${NEWS_CARD_COLOR_TOKENS.dividerStrong}`,
            mb: 1.1
          }}
        />
      ) : null}
    </>
  );
}
