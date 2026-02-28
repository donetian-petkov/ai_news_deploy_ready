'use client';

import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

type StatusPillsProps = {
  connected: boolean;
  status: string;
  totalTokens: number;
};

export function StatusPills({ connected, status, totalTokens }: StatusPillsProps) {
  const { t, i18n } = useTranslation();
  const label = connected
    ? t('status.connected')
    : status === 'error'
      ? t('status.socketError')
      : status === 'connecting'
        ? t('status.connecting')
        : t('status.disconnected');
  const tokenLabel = `${t('status.tokens')}: ${totalTokens.toLocaleString(i18n.language === 'bg' ? 'bg-BG' : 'en-US')}`;

  return (
    <>
      <Chip id="status" className="statusPill" size="small" label={label} color={connected ? 'success' : 'default'} variant={connected ? 'filled' : 'outlined'} />
      <Chip id="tokenUsage" className="statusPill" size="small" label={tokenLabel} variant="outlined" />
    </>
  );
}
