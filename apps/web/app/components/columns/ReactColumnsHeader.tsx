'use client';

import { Chip, Stack, Typography } from '@mui/material';
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
    summariesLoadingLabel
  } = header;

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
      <Typography variant="overline" sx={{ color: 'var(--text-muted)', letterSpacing: '0.14em', fontWeight: 800 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={0.8} alignItems="center">
        {summariesLoadingCount > 0 && summariesLoadingLabel ? (
          <Chip
            size="small"
            label={`${summariesLoadingLabel}: ${summariesLoadingCount}`}
            color="info"
            variant="outlined"
          />
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
