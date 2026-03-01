'use client';

import type { ElementType } from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PushPinIcon from '@mui/icons-material/PushPin';
import { Box, Button, Chip, Link as MuiLink, Stack, Tooltip, Typography } from '@mui/material';
import type { NewsCardProps } from '../reactColumns.types';
import { formatTime } from '../reactColumns.utils';

type Props = {
  item: NewsCardProps['item'];
  labels: NewsCardProps['labels'];
  iconOnly: boolean;
  actionSx: Record<string, unknown>;
  matchActionSx: Record<string, unknown>;
  accent: string;
  matchAccent: string;
  fontScale: number;
  connected: boolean;
  isPinnedNews: boolean;
  hasBodyBlock: boolean;
  performanceMode: boolean;
  ShareIconComp: ElementType;
  CopyIconComp: ElementType;
  HideIconComp: ElementType;
  onTogglePinnedNews: NewsCardProps['onTogglePinnedNews'];
  onCopyLink: NewsCardProps['onCopyLink'];
  onCopyNews: NewsCardProps['onCopyNews'];
  onHideItem: NewsCardProps['onHideItem'];
};

export function NewsCardHeader({
  item,
  labels,
  iconOnly,
  actionSx,
  matchActionSx,
  accent,
  matchAccent,
  fontScale,
  connected,
  isPinnedNews,
  hasBodyBlock,
  performanceMode,
  ShareIconComp,
  CopyIconComp,
  HideIconComp,
  onTogglePinnedNews,
  onCopyLink,
  onCopyNews,
  onHideItem
}: Props) {
  return (
    <>
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

      {hasBodyBlock ? (
        <Box sx={{ borderTop: performanceMode ? '1px solid rgba(128, 154, 201, 0.22)' : '1px solid rgba(128, 154, 201, 0.34)', mb: 1.1 }} />
      ) : null}
    </>
  );
}
