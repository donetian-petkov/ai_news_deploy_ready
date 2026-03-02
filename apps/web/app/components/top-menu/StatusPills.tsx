'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

type StatusPillsProps = {
  connected: boolean;
  status: string;
  totalTokens: number;
  language: 'en' | 'bg';
  timezone: 'system' | 'UTC' | 'Europe/Sofia' | 'Europe/London' | 'Europe/Berlin' | 'America/New_York' | 'America/Chicago' | 'America/Denver' | 'America/Los_Angeles' | 'Asia/Tokyo';
};

export function StatusPills({ connected, status, totalTokens, language, timezone }: StatusPillsProps) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const resolvedTimezone = useMemo(
    () => (timezone === 'system' ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone),
    [timezone]
  );

  const label = connected
    ? t('status.connected')
    : status === 'error'
      ? t('status.socketError')
      : status === 'connecting'
        ? t('status.connecting')
        : t('status.disconnected');
  const tokenLabel = `${t('status.tokens')}: ${totalTokens.toLocaleString(i18n.language === 'bg' ? 'bg-BG' : 'en-US')}`;
  const locale = language === 'bg' ? 'bg-BG' : 'en-US';
  const dateTimeLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: resolvedTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      }).format(new Date(now));
    } catch {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date(now));
    }
  }, [locale, now, resolvedTimezone]);

  return (
    <>
      <Chip id="status" className="statusPill" size="small" label={label} color={connected ? 'success' : 'default'} variant={connected ? 'filled' : 'outlined'} />
      <Chip id="tokenUsage" className="statusPill" size="small" label={tokenLabel} variant="outlined" />
      <Chip id="dateTime" className="statusPill statusPillDateTime" size="small" label={dateTimeLabel} variant="outlined" />
    </>
  );
}
