'use client';

import { useEffect, useMemo, useRef } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link as MuiLink,
  Stack,
  Typography
} from '@mui/material';
import { MAX_COLUMNS } from '../store/constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearResearchForItem,
  clearResearchPending,
  clearSummaryForItem,
  clearSummaryPending,
  setResearchPending,
  setSummaryPending
} from '../store/slices/newsSlice';
import { sendWsMessage, startWsConnection, stopWsConnection } from '../store/wsClient';
import type { FeedInfo, NewsItem } from '../store/types';

type Props = {
  wsUrl: string;
};

function formatTime(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  try {
    return new Date(ms).toLocaleString('bg-BG', { hour12: false });
  } catch {
    return '';
  }
}

function extractConfidence(research: string): string {
  const m = String(research || '').match(/confidence\s*:\s*(low|medium|high)/i);
  if (!m) return '';
  const level = String(m[1] || '').toLowerCase();
  if (level === 'high') return 'High';
  if (level === 'medium') return 'Medium';
  if (level === 'low') return 'Low';
  return '';
}

function compactResearch(research: string): string {
  const normalized = String(research || '').replace(/\s+/g, ' ').trim();
  return normalized.length > 340 ? `${normalized.slice(0, 340)}...` : normalized;
}

export default function ReactColumnsPreview({ wsUrl }: Props) {
  const dispatch = useAppDispatch();
  const connected = useAppSelector(s => s.connection.connected);
  const status = useAppSelector(s => s.connection.status);
  const feeds = useAppSelector(s => s.feeds.feeds);
  const itemsByFeed = useAppSelector(s => s.news.itemsByFeed);
  const summaryPendingById = useAppSelector(s => s.news.summaryPendingById);
  const researchPendingById = useAppSelector(s => s.news.researchPendingById);
  const pendingTimeoutsRef = useRef<Record<string, number>>({});
  const researchTimeoutsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    startWsConnection(dispatch, wsUrl);

    return () => {
      stopWsConnection();
      const ids = Object.keys(pendingTimeoutsRef.current);
      for (const id of ids) {
        window.clearTimeout(pendingTimeoutsRef.current[id]);
      }
      pendingTimeoutsRef.current = {};
      const rIds = Object.keys(researchTimeoutsRef.current);
      for (const id of rIds) {
        window.clearTimeout(researchTimeoutsRef.current[id]);
      }
      researchTimeoutsRef.current = {};
    };
  }, [dispatch, wsUrl]);

  const previewFeeds = useMemo(() => {
    if (feeds.length) return feeds.slice(0, MAX_COLUMNS);
    const fallback = Object.keys(itemsByFeed).slice(0, MAX_COLUMNS).map(url => ({
      url,
      label: url,
      kind: 'rss' as const,
      intervalSec: 120
    }));
    return fallback;
  }, [feeds, itemsByFeed]);

  const requestSummary = (it: NewsItem) => {
    if (!connected) return;

    dispatch(setSummaryPending(it.id));
    dispatch(clearSummaryForItem({ id: it.id, feedUrl: it.feedUrl }));

    if (pendingTimeoutsRef.current[it.id]) {
      window.clearTimeout(pendingTimeoutsRef.current[it.id]);
    }
    pendingTimeoutsRef.current[it.id] = window.setTimeout(() => {
      dispatch(clearSummaryPending(it.id));
      delete pendingTimeoutsRef.current[it.id];
    }, 30000);

    const ok = sendWsMessage({
      type: 'run_summary_item',
      id: it.id,
      feedUrl: it.feedUrl
    });
    if (!ok) dispatch(clearSummaryPending(it.id));
  };

  const requestResearch = (it: NewsItem) => {
    if (!connected) return;

    dispatch(setResearchPending(it.id));
    dispatch(clearResearchForItem({ id: it.id, feedUrl: it.feedUrl }));

    if (researchTimeoutsRef.current[it.id]) {
      window.clearTimeout(researchTimeoutsRef.current[it.id]);
    }
    researchTimeoutsRef.current[it.id] = window.setTimeout(() => {
      dispatch(clearResearchPending(it.id));
      delete researchTimeoutsRef.current[it.id];
    }, 45000);

    const ok = sendWsMessage({
      type: 'run_research_item',
      id: it.id,
      feedUrl: it.feedUrl
    });
    if (!ok) dispatch(clearResearchPending(it.id));
  };

  return (
    <Box className="container" sx={{ pt: 1, pb: 0.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
        <Typography variant="overline" sx={{ color: 'rgba(235,240,255,0.8)', letterSpacing: '0.14em', fontWeight: 800 }}>
          React Renderer Preview
        </Typography>
        <Chip
          size="small"
          label={connected ? 'Live via WebSocket' : `Disconnected (${status})`}
          color={connected ? 'success' : 'default'}
          variant={connected ? 'filled' : 'outlined'}
        />
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
        }}
      >
        {previewFeeds.map((feed: FeedInfo) => {
          const items = itemsByFeed[feed.url] || [];
          return (
            <Card key={feed.url} variant="outlined" sx={{ background: 'rgba(15, 22, 38, 0.8)', borderColor: 'rgba(97, 123, 161, 0.42)' }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                  <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                    {feed.label}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={items.length} />
                    <Chip size="small" variant="outlined" label={feed.kind} />
                  </Stack>
                </Stack>

                <Stack spacing={1.2}>
                  {items.length === 0 ? (
                    <Alert severity="info" variant="outlined">Waiting for news...</Alert>
                  ) : items.map(it => (
                    <Card
                      key={it.id}
                      variant="outlined"
                      sx={{
                        background: 'rgba(5, 11, 24, 0.72)',
                        borderColor: it.isMatch ? 'rgba(255, 198, 84, 0.68)' : 'rgba(100, 128, 170, 0.35)'
                      }}
                    >
                      <CardContent sx={{ pb: '12px !important' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(210,219,235,0.74)' }}>
                            {formatTime(it.publishedMs)}
                          </Typography>
                          {it.isMatch ? <Chip size="small" label="MATCH" color="warning" variant="outlined" /> : null}
                        </Stack>

                        <MuiLink
                          href={it.link}
                          target="_blank"
                          rel="noreferrer"
                          underline="hover"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            fontSize: '1.03rem',
                            lineHeight: 1.32,
                            fontWeight: 800,
                            color: 'primary.light',
                            mb: 1
                          }}
                        >
                          <span>{it.title}</span>
                          <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </MuiLink>

                        <Stack direction="row" spacing={1} sx={{ mb: it.summary ? 1 : 0 }}>
                          <Button
                            size="small"
                            variant={summaryPendingById[it.id] ? 'contained' : 'outlined'}
                            startIcon={<AutoAwesomeIcon />}
                            onClick={() => requestSummary(it)}
                            disabled={!connected || !!summaryPendingById[it.id]}
                          >
                            {summaryPendingById[it.id] ? 'Generating Summary...' : 'Summary'}
                          </Button>
                          <Button
                            size="small"
                            variant={researchPendingById[it.id] ? 'contained' : 'outlined'}
                            startIcon={<ManageSearchIcon />}
                            onClick={() => requestResearch(it)}
                            disabled={!connected || !!researchPendingById[it.id]}
                          >
                            {researchPendingById[it.id] ? 'Researching...' : 'Research'}
                          </Button>
                        </Stack>

                        {it.summary ? (
                          <Typography variant="body2" sx={{ color: 'rgba(226,234,250,0.95)', whiteSpace: 'pre-wrap' }}>
                            {it.summary}
                          </Typography>
                        ) : null}
                        {it.research ? (
                          <Box sx={{ mt: 1 }}>
                            {extractConfidence(it.research) ? (
                              <Typography variant="caption" sx={{ color: 'rgba(212,220,236,0.75)', display: 'block', mb: 0.35 }}>
                                Confidence: {extractConfidence(it.research)}
                              </Typography>
                            ) : null}
                            <Typography variant="body2" sx={{ color: 'rgba(205,218,238,0.92)', whiteSpace: 'pre-wrap' }}>
                              {compactResearch(it.research)}
                            </Typography>
                          </Box>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
