'use client';

import { useEffect, useMemo, useRef } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Link as MuiLink,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { MAX_COLUMNS } from '../store/constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  removeFeedLocally,
  setFeedBudgetSetting,
  setFeedResearchSetting,
  setFeedSummarySetting,
  toggleFeedControls,
  togglePinned
} from '../store/slices/feedsSlice';
import {
  clearResearchForItem,
  clearResearchPending,
  enqueueAskQuestion,
  receiveAskReply,
  clearSummaryForItem,
  clearSummaryPending,
  setAskDraft,
  toggleAskOpen,
  setResearchPending,
  setSummaryPending
} from '../store/slices/newsSlice';
import { sendWsMessage, startWsConnection, stopWsConnection } from '../store/wsClient';
import type { BudgetMode, FeedInfo, NewsItem } from '../store/types';

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
  const pinnedByUrl = useAppSelector(s => s.feeds.pinnedByUrl);
  const controlsOpenByUrl = useAppSelector(s => s.feeds.controlsOpenByUrl);
  const itemsByFeed = useAppSelector(s => s.news.itemsByFeed);
  const summaryPendingById = useAppSelector(s => s.news.summaryPendingById);
  const researchPendingById = useAppSelector(s => s.news.researchPendingById);
  const askByItem = useAppSelector(s => s.news.askByItem);
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
    if (feeds.length) {
      const list = [...feeds];
      list.sort((a, b) => {
        const aPinned = !!pinnedByUrl[a.url];
        const bPinned = !!pinnedByUrl[b.url];
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        return 0;
      });
      return list.slice(0, MAX_COLUMNS);
    }
    const fallback = Object.keys(itemsByFeed).slice(0, MAX_COLUMNS).map(url => ({
      url,
      label: url,
      kind: 'rss' as const,
      intervalSec: 120,
      summaryEnabled: false,
      researchEnabled: false,
      budget: 'standard' as const,
      sortMode: 'newest' as const,
      filters: { onlyMatches: false, onlyResearched: false, onlySummaries: false }
    }));
    return fallback;
  }, [feeds, itemsByFeed, pinnedByUrl]);

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

  const askKey = (it: NewsItem) => `${it.feedUrl}::${it.id}`;

  const removeFeed = (feedUrl: string) => {
    if (!connected) return;
    const ok = sendWsMessage({ type: 'remove_feed', feedUrl });
    if (ok) dispatch(removeFeedLocally(feedUrl));
  };

  const requestAsk = (it: NewsItem) => {
    if (!connected) return;
    const k = askKey(it);
    const askState = askByItem[k] || { used: 0, remaining: 5, draft: '', pending: false };
    const question = String(askState.draft || '').trim().slice(0, 400);
    if (!question || askState.pending || askState.remaining <= 0) return;

    const usedBefore = askState.used;
    const remainingBefore = askState.remaining;
    dispatch(enqueueAskQuestion({ id: it.id, feedUrl: it.feedUrl, question }));

    const ok = sendWsMessage({
      type: 'ask_agent_item',
      id: it.id,
      feedUrl: it.feedUrl,
      question,
      researchMode: 'auto'
    });
    if (!ok) {
      dispatch(receiveAskReply({
        id: it.id,
        feedUrl: it.feedUrl,
        question,
        error: 'Socket unavailable. Try again.',
        used: usedBefore,
        remaining: remainingBefore
      }));
    }
  };

  const toggleFeedSummary = (feed: FeedInfo) => {
    if (!connected) return;
    const nextEnabled = !feed.summaryEnabled;
    const ok = sendWsMessage({ type: 'set_feed_summary', feedUrl: feed.url, enabled: nextEnabled });
    if (ok) dispatch(setFeedSummarySetting({ feedUrl: feed.url, enabled: nextEnabled }));
  };

  const toggleFeedResearch = (feed: FeedInfo) => {
    if (!connected) return;
    const nextEnabled = !feed.researchEnabled;
    const ok = sendWsMessage({ type: 'set_feed_research', feedUrl: feed.url, enabled: nextEnabled });
    if (ok) dispatch(setFeedResearchSetting({ feedUrl: feed.url, enabled: nextEnabled }));
  };

  const setFeedBudget = (feed: FeedInfo, budget: BudgetMode) => {
    if (!connected) return;
    const ok = sendWsMessage({ type: 'set_feed_budget', feedUrl: feed.url, budget });
    if (ok) dispatch(setFeedBudgetSetting({ feedUrl: feed.url, budget }));
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
          const pinned = !!pinnedByUrl[feed.url];
          const controlsOpen = typeof controlsOpenByUrl[feed.url] === 'boolean' ? !!controlsOpenByUrl[feed.url] : true;
          return (
            <Card key={feed.url} variant="outlined" sx={{ background: 'rgba(15, 22, 38, 0.8)', borderColor: 'rgba(97, 123, 161, 0.42)' }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                  <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, pr: 1 }}>
                    {feed.label}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={items.length} />
                    <Chip size="small" variant="outlined" label={feed.kind} />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 1.1 }} flexWrap="wrap">
                  <Button
                    size="small"
                    variant={pinned ? 'contained' : 'outlined'}
                    startIcon={pinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                    onClick={() => dispatch(togglePinned(feed.url))}
                  >
                    {pinned ? 'Pinned' : 'Pin'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => removeFeed(feed.url)}
                    disabled={!connected}
                  >
                    Remove
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<TuneIcon />}
                    onClick={() => dispatch(toggleFeedControls(feed.url))}
                  >
                    {controlsOpen ? 'Hide controls' : 'Show controls'}
                  </Button>
                </Stack>
                {controlsOpen ? (
                  <Stack direction="row" spacing={1} sx={{ mb: 1.1 }} flexWrap="wrap" alignItems="center">
                    <Button
                      size="small"
                      variant={feed.summaryEnabled ? 'contained' : 'outlined'}
                      onClick={() => toggleFeedSummary(feed)}
                      disabled={!connected}
                    >
                      {feed.summaryEnabled ? 'Summaries: ON' : 'Summaries: OFF'}
                    </Button>
                    <Button
                      size="small"
                      variant={feed.researchEnabled ? 'contained' : 'outlined'}
                      onClick={() => toggleFeedResearch(feed)}
                      disabled={!connected}
                    >
                      {feed.researchEnabled ? 'Auto Research: ON' : 'Auto Research: OFF'}
                    </Button>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={feed.budget}
                        onChange={e => setFeedBudget(feed, e.target.value as BudgetMode)}
                        disabled={!connected}
                      >
                        <MenuItem value="low">Budget: Low</MenuItem>
                        <MenuItem value="standard">Budget: Standard</MenuItem>
                        <MenuItem value="high">Budget: High</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                ) : null}

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
                        {(() => {
                          const key = askKey(it);
                          const askState = askByItem[key] || {
                            open: false,
                            draft: '',
                            pending: false,
                            used: 0,
                            remaining: 5,
                            messages: []
                          };
                          return (
                            <>
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

                        {controlsOpen ? (
                          <Stack direction="row" spacing={1} sx={{ mb: it.summary ? 1 : 0 }} flexWrap="wrap">
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
                            <Button
                              size="small"
                              variant={askState.open ? 'contained' : 'outlined'}
                              startIcon={<SmartToyIcon />}
                              onClick={() => dispatch(toggleAskOpen({ id: it.id, feedUrl: it.feedUrl }))}
                              disabled={!connected}
                            >
                              Ask Agent
                            </Button>
                          </Stack>
                        ) : null}

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
                        {askState.open ? (
                          <Box sx={{ mt: 1.1, p: 1, border: '1px solid rgba(106,128,162,0.4)', borderRadius: 1.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                              <Typography variant="caption" sx={{ color: 'rgba(210,219,235,0.74)' }}>
                                Ask Agent
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(188,203,229,0.75)' }}>
                                Questions left: {askState.remaining}
                              </Typography>
                            </Stack>
                            <Stack spacing={0.8} sx={{ mb: 0.8, maxHeight: 180, overflow: 'auto' }}>
                              {askState.messages.map((m, idx) => (
                                <Box key={`${idx}-${m.q.slice(0, 18)}`}>
                                  <Typography variant="caption" sx={{ color: 'rgba(146,204,255,0.92)', display: 'block' }}>
                                    Q: {m.q}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: m.error ? 'rgba(255,168,168,0.95)' : 'rgba(216,227,246,0.92)', display: 'block' }}>
                                    A: {m.error || m.a || '...'}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Ask about this specific news..."
                                value={askState.draft}
                                onChange={e => dispatch(setAskDraft({ id: it.id, feedUrl: it.feedUrl, draft: e.target.value.slice(0, 400) }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    requestAsk(it);
                                  }
                                }}
                              />
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => requestAsk(it)}
                                disabled={!connected || askState.pending || askState.remaining <= 0 || !String(askState.draft || '').trim()}
                              >
                                {askState.pending ? 'Thinking...' : 'Send'}
                              </Button>
                            </Stack>
                          </Box>
                        ) : null}
                            </>
                          );
                        })()}
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
