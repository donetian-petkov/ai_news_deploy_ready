'use client';

import { Chip } from '@mui/material';

type StatusPillsProps = {
  connected: boolean;
  status: string;
  totalTokens: number;
};

export function StatusPills({ connected, status, totalTokens }: StatusPillsProps) {
  const label = connected ? 'Connected' : status === 'error' ? 'Socket error' : status === 'connecting' ? 'Connecting...' : 'Disconnected';

  return (
    <>
      <Chip id="status" className="statusPill" size="small" label={label} color={connected ? 'success' : 'default'} variant={connected ? 'filled' : 'outlined'} />
      <Chip id="tokenUsage" className="statusPill" size="small" label={`Tokens: ${totalTokens.toLocaleString('en-US')}`} variant="outlined" />
    </>
  );
}
