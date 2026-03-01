'use client';

import { Chip, Stack, Typography } from '@mui/material';

type Props = {
  title: string;
  liveLabel: string;
  disconnectedLabel: string;
  connected: boolean;
  status: string;
};

export function ReactColumnsHeader({ title, liveLabel, disconnectedLabel, connected, status }: Props) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
      <Typography variant="overline" sx={{ color: 'var(--text-muted)', letterSpacing: '0.14em', fontWeight: 800 }}>
        {title}
      </Typography>
      <Chip
        size="small"
        label={connected ? liveLabel : `${disconnectedLabel} (${status})`}
        color={connected ? 'success' : 'default'}
        variant={connected ? 'filled' : 'outlined'}
      />
    </Stack>
  );
}
