'use client';

import { useState } from 'react';
import { Box, Chip, Popover, Stack, Typography } from '@mui/material';
import { useFeedColumnsContext } from './context/useFeedColumnsContext';

export function ReactColumnsHeader() {
  const { header } = useFeedColumnsContext();
  const {
    title,
    liveLabel,
    disconnectedLabel,
    connected,
    status,
    summariesLoadingCount,
    summariesStalledCount,
    summariesLoadingLabel,
    summariesLoadingItems,
    researchesLoadingCount,
    researchesStalledCount,
    researchesLoadingLabel,
    researchesLoadingItems,
    titlesLoadingCount,
    titlesStalledCount,
    titlesLoadingLabel,
    titlesLoadingItems
  } = header;
  const [detailsTarget, setDetailsTarget] = useState<{
    anchor: HTMLElement;
    label: string;
    items: string[];
  } | null>(null);
  const detailsAnchor = detailsTarget?.anchor || null;
  const detailsOpen = Boolean(detailsAnchor);
  const loadingGroups = [
    {
      key: 'summaries',
      label: summariesLoadingLabel,
      count: summariesLoadingCount,
      stalledCount: summariesStalledCount,
      items: summariesLoadingItems
    },
    {
      key: 'titles',
      label: titlesLoadingLabel,
      count: titlesLoadingCount,
      stalledCount: titlesStalledCount,
      items: titlesLoadingItems
    },
    {
      key: 'researches',
      label: researchesLoadingLabel,
      count: researchesLoadingCount,
      stalledCount: researchesStalledCount,
      items: researchesLoadingItems
    }
  ].filter(group => group.count > 0 && group.label);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'center' }}
      sx={{ mb: 1.25, gap: { xs: 0.65, sm: 0 } }}
    >
      <Typography
        variant="overline"
        sx={{
          color: 'var(--text-muted)',
          letterSpacing: '0.14em',
          fontWeight: 800,
          lineHeight: 1.2,
          whiteSpace: { xs: 'normal', sm: 'nowrap' }
        }}
      >
        {title}
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={0.7}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        flexWrap="wrap"
        justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
      >
        {loadingGroups.map(group => (
          <Chip
            key={group.key}
            size="small"
            label={`${group.label}: ${group.count}${group.stalledCount > 0 ? ` • stuck: ${group.stalledCount}` : ''}`}
            color={group.stalledCount > 0 ? 'warning' : 'info'}
            variant="outlined"
            onClick={e => setDetailsTarget({ anchor: e.currentTarget, label: group.label, items: group.items })}
            clickable
            title={`Click to view ${group.label.toLowerCase()} queue details`}
            sx={{
              maxWidth: { xs: '100%', sm: 'none' },
              justifyContent: { xs: 'space-between', sm: 'center' },
              height: { xs: 30, sm: 32 },
              '& .MuiChip-label': {
                px: { xs: 1.1, sm: 1.35 },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: { xs: '0.92rem', sm: '0.96rem' },
                fontWeight: 760
              }
            }}
          />
        ))}
        <Popover
          open={detailsOpen}
          anchorEl={detailsAnchor}
          onClose={() => setDetailsTarget(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Box sx={{ p: 1.2, maxWidth: 560, maxHeight: 360, overflow: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 0.6 }}>
              {detailsTarget?.label || 'Queue'} ({detailsTarget?.items.length || 0})
            </Typography>
            <Stack spacing={0.45}>
              {(detailsTarget?.items.length || 0) ? detailsTarget!.items.slice(0, 40).map((line, idx) => (
                <Typography key={`${idx}-${line}`} variant="body2">
                  {idx + 1}. {line}
                </Typography>
              )) : (
                <Typography variant="body2">No pending items.</Typography>
              )}
              {(detailsTarget?.items.length || 0) > 40 ? (
                <Typography variant="caption" color="text.secondary">
                  ...and {(detailsTarget?.items.length || 0) - 40} more
                </Typography>
              ) : null}
            </Stack>
          </Box>
        </Popover>
        <Chip
          size="small"
          label={connected ? liveLabel : `${disconnectedLabel} (${status})`}
          color={connected ? 'success' : 'default'}
          variant={connected ? 'filled' : 'outlined'}
          sx={{
            maxWidth: { xs: '100%', sm: 'none' },
            alignSelf: { xs: 'flex-start', sm: 'auto' },
            '& .MuiChip-label': {
              px: { xs: 1.1, sm: 1.35 },
              fontSize: { xs: '0.9rem', sm: '0.96rem' },
              fontWeight: 760
            }
          }}
        />
      </Stack>
    </Stack>
  );
}
