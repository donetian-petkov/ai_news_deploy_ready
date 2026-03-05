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
    summariesLoadingLabel,
    summariesLoadingItems
  } = header;
  const [detailsAnchor, setDetailsAnchor] = useState<HTMLElement | null>(null);
  const detailsOpen = Boolean(detailsAnchor);

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
      <Typography variant="overline" sx={{ color: 'var(--text-muted)', letterSpacing: '0.14em', fontWeight: 800 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={0.8} alignItems="center">
        {summariesLoadingCount > 0 && summariesLoadingLabel ? (
          <>
            <Chip
              size="small"
              label={`${summariesLoadingLabel}: ${summariesLoadingCount}`}
              color="info"
              variant="outlined"
              onClick={e => setDetailsAnchor(e.currentTarget)}
              clickable
              title="Click to view which summaries are pending"
            />
            <Popover
              open={detailsOpen}
              anchorEl={detailsAnchor}
              onClose={() => setDetailsAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box sx={{ p: 1.2, maxWidth: 560, maxHeight: 360, overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 0.6 }}>
                  Pending summaries ({summariesLoadingItems.length})
                </Typography>
                <Stack spacing={0.45}>
                  {summariesLoadingItems.length ? summariesLoadingItems.slice(0, 40).map((line, idx) => (
                    <Typography key={`${idx}-${line}`} variant="body2">
                      {idx + 1}. {line}
                    </Typography>
                  )) : (
                    <Typography variant="body2">No pending summary items.</Typography>
                  )}
                  {summariesLoadingItems.length > 40 ? (
                    <Typography variant="caption" color="text.secondary">
                      ...and {summariesLoadingItems.length - 40} more
                    </Typography>
                  ) : null}
                </Stack>
              </Box>
            </Popover>
          </>
        ) : null}
        <Chip
          size="small"
          label={connected ? liveLabel : `${disconnectedLabel} (${status})`}
          color={connected ? 'success' : 'default'}
          variant={connected ? 'filled' : 'outlined'}
        />
      </Stack>
    </Stack>
  );
}
