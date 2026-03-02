'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chip } from '@mui/material';
import type { TopMenuDateFormat, TopMenuTimezone } from './topMenu.services';

type DateTimePillProps = {
  language: 'en' | 'bg';
  timezone: TopMenuTimezone;
  dateFormat: TopMenuDateFormat;
};

function getDateAndTimeText(
  now: number,
  locale: string,
  timezone: TopMenuTimezone,
  dateFormat: TopMenuDateFormat
): string {
  const resolvedTimezone = timezone === 'system'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : timezone;

  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: resolvedTimezone,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(new Date(now));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value || '';

  const year = read('year');
  const month = read('month');
  const day = read('day');
  const hour = read('hour');
  const minute = read('minute');
  const second = read('second');

  const dateText = dateFormat === 'mmddyy'
    ? `${month}/${day}/${year}`
    : dateFormat === 'yyyymmdd'
      ? `20${year}-${month}-${day}`
      : `${day}/${month}/${year}`;

  return `${hour}:${minute}:${second} · ${dateText}`;
}

export function DateTimePill({ language, timezone, dateFormat }: DateTimePillProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const locale = language === 'bg' ? 'bg-BG' : 'en-GB';
  const dateTimeText = useMemo(
    () => getDateAndTimeText(now, locale, timezone, dateFormat),
    [dateFormat, locale, now, timezone]
  );

  return (
    <Chip
      id="dateTime"
      className="statusPill statusPillDateTime"
      size="small"
      label={dateTimeText}
      variant="outlined"
    />
  );
}
