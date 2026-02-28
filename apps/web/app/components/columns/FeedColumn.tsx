'use client';

import type { DragEvent } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import RedditIcon from '@mui/icons-material/Reddit';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography
} from '@mui/material';
import type { BudgetMode, FeedInfo, NewsItem, SortMode } from '../../store/types';
import { FILTERED_FEED_URL } from '../../store/constants';
import type { BodyMode, CardLabels, ColumnPalette, FeedFilterPreset, VibeIcons } from './reactColumns.types';
import { collapseText, compactResearch, extractConfidence, getFeedFilterPreset } from './reactColumns.utils';
import { NewsCard } from './NewsCard';

type AskState = {
  open: boolean;
  draft: string;
  pending: boolean;
  remaining: number;
  messages: Array<{ q: string; a?: string; error?: string }>;
};

type DragState = {
  canDrag: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragEnter: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  setNode: (node: HTMLDivElement | null) => void;
};

type FeedColumnProps = {
  feed: FeedInfo;
  columnIdx: number;
  palette: ColumnPalette;
  performanceMode: boolean;
  moodFilter: string;
  typeFilter: string;
  searchQuery: string;
  hideAllResearch: boolean;
  hideAllSummaries: boolean;
  aiEnabled: boolean;
  aiAvailable: boolean;
  buttonMode: 'icons' | 'text';
  fontScale: number;
  connected: boolean;
  compactBtnSx: Record<string, unknown>;
  compactFormSx: Record<string, unknown>;
  labels: Record<string, string>;
  cardLabels: CardLabels;
  vibeIcons: VibeIcons;
  filteredColumnItems: NewsItem[];
  itemsByFeed: Record<string, NewsItem[]>;
  visibleLimit: number;
  isHydrated: boolean;
  pinned: boolean;
  controlsOpen: boolean;
  advancedControlsOpen: boolean;
  deleteAge: 'yesterday' | 'week' | 'month' | 'year';
  summaryPendingById: Record<string, true>;
  researchPendingById: Record<string, true>;
  pinnedNewsById: Record<string, true>;
  askByItem: Record<string, AskState>;
  bodyModes: Record<string, BodyMode>;
  getBodyMode: (key: string, text: string, threshold: number) => BodyMode;
  getDefaultBodyMode: (text: string, threshold: number) => BodyMode;
  setBodyMode: (key: string, mode: BodyMode) => void;
  drag: DragState;
  onTogglePinnedColumn: (feedUrl: string) => void;
  onRemoveFeed: (feedUrl: string) => void;
  onToggleFeedControls: (feedUrl: string) => void;
  onToggleFeedSummary: (feed: FeedInfo) => void;
  onToggleFeedResearch: (feed: FeedInfo) => void;
  onSetFeedBudget: (feed: FeedInfo, budget: BudgetMode) => void;
  onSetFeedInterval: (feed: FeedInfo, intervalSec: number) => void;
  onSetFeedSortMode: (feed: FeedInfo, sortMode: SortMode) => void;
  onSetFeedFilterPreset: (feed: FeedInfo, preset: FeedFilterPreset) => void;
  onToggleAdvancedControls: (feedUrl: string) => void;
  onSetDeleteAge: (feedUrl: string, age: 'yesterday' | 'week' | 'month' | 'year') => void;
  onRemoveOldInFeed: (feed: FeedInfo) => void;
  onShowMoreNews: (feedUrl: string) => void;
  onResetNewsToTen: (feedUrl: string) => void;
  onTogglePinnedNews: (id: string) => void;
  onCopyLink: (url: string) => void;
  onCopyNewsPayload: (it: NewsItem) => void;
  onHideItem: (it: NewsItem) => void;
  onRequestSummary: (it: NewsItem) => void;
  onRequestResearch: (it: NewsItem) => void;
  onToggleAsk: (id: string, feedUrl: string) => void;
  onSetAskDraft: (id: string, feedUrl: string, draft: string) => void;
  onAskSubmit: (it: NewsItem) => void;
};

function askKey(it: NewsItem): string {
  return `${it.feedUrl}::${it.id}`;
}

function bodyKey(it: NewsItem, kind: 'summary' | 'research'): string {
  return `${it.feedUrl}::${it.id}::${kind}`;
}

export function FeedColumn({
  feed,
  columnIdx,
  palette,
  performanceMode,
  moodFilter,
  typeFilter,
  searchQuery,
  hideAllResearch,
  hideAllSummaries,
  aiEnabled,
  aiAvailable,
  buttonMode,
  fontScale,
  connected,
  compactBtnSx,
  compactFormSx,
  labels,
  cardLabels,
  vibeIcons,
  filteredColumnItems,
  itemsByFeed,
  visibleLimit,
  isHydrated,
  pinned,
  controlsOpen,
  advancedControlsOpen,
  deleteAge,
  summaryPendingById,
  researchPendingById,
  pinnedNewsById,
  askByItem,
  bodyModes,
  getBodyMode,
  getDefaultBodyMode,
  setBodyMode,
  drag,
  onTogglePinnedColumn,
  onRemoveFeed,
  onToggleFeedControls,
  onToggleFeedSummary,
  onToggleFeedResearch,
  onSetFeedBudget,
  onSetFeedInterval,
  onSetFeedSortMode,
  onSetFeedFilterPreset,
  onToggleAdvancedControls,
  onSetDeleteAge,
  onRemoveOldInFeed,
  onShowMoreNews,
  onResetNewsToTen,
  onTogglePinnedNews,
  onCopyLink,
  onCopyNewsPayload,
  onHideItem,
  onRequestSummary,
  onRequestResearch,
  onToggleAsk,
  onSetAskDraft,
  onAskSubmit
}: FeedColumnProps) {
  const isMatchColumn = feed.url === FILTERED_FEED_URL || String(feed.label || '').toLowerCase().startsWith('filtered');
  const colTheme: 'a' | 'b' | 'match' = isMatchColumn ? 'match' : (columnIdx % 2 === 0 ? 'a' : 'b');
  const accent = colTheme === 'a' ? palette.a : colTheme === 'b' ? palette.b : palette.m;
  const soft = colTheme === 'a' ? palette.aSoft : colTheme === 'b' ? palette.bSoft : palette.mSoft;
  const items = isMatchColumn ? filteredColumnItems : (itemsByFeed[feed.url] || []);
  const moodFilterEffective = performanceMode ? 'all' : moodFilter;
  const typeFilterEffective = performanceMode ? 'all' : typeFilter;
  const moodFilteredItems = moodFilterEffective === 'all'
    ? items
    : items.filter(it => it.mood === moodFilterEffective);
  const typeFilteredItems = typeFilterEffective === 'all'
    ? moodFilteredItems
    : moodFilteredItems.filter(it => it.newsType === typeFilterEffective);
  const normalizedQuery = String(searchQuery || '').trim().toLowerCase();
  const itemsVisible = normalizedQuery
    ? typeFilteredItems.filter(it => {
      const hay = `${it.title}\n${it.summary || ''}\n${it.research || ''}`.toLowerCase();
      return hay.includes(normalizedQuery);
    })
    : typeFilteredItems;
  const shownItems = itemsVisible.slice(0, visibleLimit);

  return (
    <Box
      key={feed.url}
      data-feed-url={feed.url}
      sx={{
        width: '100%',
        minWidth: 0,
        mx: 'auto'
      }}
      draggable={drag.canDrag}
      onDragStart={drag.onDragStart}
      onDragEnd={drag.onDragEnd}
      ref={drag.setNode}
      onDragEnter={drag.onDragEnter}
      onDragOver={drag.onDragOver}
      onDrop={drag.onDrop}
    >
      <Card
        variant="outlined"
        sx={{
          background: performanceMode
            ? (isMatchColumn ? 'rgba(28, 20, 7, 0.98)' : 'rgba(8, 14, 29, 0.98)')
            : (isMatchColumn
              ? `linear-gradient(180deg, ${palette.mSoft}, rgba(34, 20, 7, 0.95) 74%, rgba(10, 14, 28, 0.98) 100%), var(--column-shell-overlay)`
              : `linear-gradient(180deg, ${soft}, rgba(9, 15, 30, 0.96) 78%), var(--column-shell-overlay)`),
          borderColor: drag.isDropTarget
            ? accent
            : (drag.isDragging ? accent : (isMatchColumn ? `${palette.m}` : 'rgba(97, 123, 161, 0.42)')),
          borderTop: `4px solid ${isMatchColumn ? palette.m : accent}`,
          boxShadow: performanceMode
            ? (drag.isDropTarget ? `0 0 0 1px ${accent}` : 'none')
            : (drag.isDropTarget
              ? `0 0 0 2px ${accent}66, 0 18px 34px rgba(0,0,0,0.30)`
              : (isMatchColumn
                ? '0 12px 26px rgba(0,0,0,0.30), inset 0 0 0 1px rgba(255,180,62,0.12)'
                : '0 10px 22px rgba(0,0,0,0.22)')),
          borderRadius: 'var(--column-radius, 16px)',
          color: 'rgba(234, 242, 255, 0.96)',
          opacity: drag.isDragging ? 0.45 : 1,
          transform: drag.isDragging ? 'scale(0.985)' : (drag.isDropTarget ? 'translateY(-4px)' : 'translateY(0)'),
          transition: performanceMode ? 'none' : 'transform 130ms ease, box-shadow 130ms ease, opacity 130ms ease, border-color 130ms ease',
          cursor: drag.canDrag ? (drag.isDragging ? 'grabbing' : 'grab') : 'default'
        }}
      >
        <CardContent sx={{ pb: '12px !important', px: 2.2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: `${18 * fontScale}px`,
                fontWeight: 800,
                lineHeight: 1.2,
                pr: 1,
                pl: 0.3,
                color: 'rgba(232,243,255,0.97)',
                fontFamily: 'var(--news-title-font-family, var(--font-family))'
              }}
            >
              {feed.label}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={itemsVisible.length} sx={{ color: 'rgba(231,242,255,0.96)', bgcolor: 'rgba(79, 114, 168, 0.24)', borderColor: accent }} />
              <Chip
                size="small"
                variant="outlined"
                icon={feed.kind === 'youtube' ? <SmartDisplayIcon /> : feed.kind === 'reddit' ? <RedditIcon /> : <RssFeedIcon />}
                label=""
                sx={{
                  color: 'rgba(231,242,255,0.96)',
                  borderColor: accent,
                  '& .MuiChip-label': { px: 0.2 },
                  '& .MuiChip-icon': { color: 'rgba(231,242,255,0.96)', ml: 0.5, mr: 0.1, fontSize: 16 }
                }}
              />
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mb: 1.1 }} flexWrap="wrap">
            {!isMatchColumn ? (
              <Button
                size="small"
                variant={pinned ? 'contained' : 'outlined'}
                startIcon={pinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
                onClick={() => onTogglePinnedColumn(feed.url)}
                sx={compactBtnSx}
              >
                {pinned ? labels.pinned : labels.pin}
              </Button>
            ) : null}
            {!isMatchColumn ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => onRemoveFeed(feed.url)}
                disabled={!connected}
                sx={compactBtnSx}
              >
                {labels.remove}
              </Button>
            ) : null}
            <Button
              size="small"
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={() => onToggleFeedControls(feed.url)}
              sx={compactBtnSx}
            >
              {controlsOpen ? labels.hideControls : labels.showControls}
            </Button>
          </Stack>
          {isHydrated && controlsOpen ? (
            <Box
              sx={{
                mb: 1.1,
                display: 'grid',
                gap: 0.8,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))'
                }
              }}
            >
              {aiAvailable ? (
                <>
                  <Button
                    size="small"
                    fullWidth
                    variant={feed.summaryEnabled ? 'contained' : 'outlined'}
                    onClick={() => onToggleFeedSummary(feed)}
                    disabled={!connected}
                    sx={compactBtnSx}
                  >
                    {feed.summaryEnabled ? labels.summariesOn : labels.summariesOff}
                  </Button>
                  <Button
                    size="small"
                    fullWidth
                    variant={feed.researchEnabled ? 'contained' : 'outlined'}
                    onClick={() => onToggleFeedResearch(feed)}
                    disabled={!connected}
                    sx={compactBtnSx}
                  >
                    {feed.researchEnabled ? labels.researchOn : labels.researchOff}
                  </Button>
                  <FormControl size="small" fullWidth sx={compactFormSx}>
                    <Select
                      value={feed.budget}
                      onChange={e => onSetFeedBudget(feed, e.target.value as BudgetMode)}
                      disabled={!connected}
                    >
                      <MenuItem value="low">{labels.budgetLow}</MenuItem>
                      <MenuItem value="standard">{labels.budgetStandard}</MenuItem>
                      <MenuItem value="high">{labels.budgetHigh}</MenuItem>
                    </Select>
                  </FormControl>
                </>
              ) : (
                <Alert severity="info" variant="outlined" sx={{ gridColumn: '1 / -1' }}>
                  {labels.aiUnavailable}
                </Alert>
              )}
              <FormControl size="small" fullWidth sx={compactFormSx}>
                <Select
                  value={String(feed.intervalSec || 120)}
                  onChange={e => onSetFeedInterval(feed, Number(e.target.value) || 120)}
                  disabled={!connected}
                >
                  <MenuItem value="45">{labels.poll45}</MenuItem>
                  <MenuItem value="60">{labels.poll60}</MenuItem>
                  <MenuItem value="90">{labels.poll90}</MenuItem>
                  <MenuItem value="120">{labels.poll120}</MenuItem>
                  <MenuItem value="180">{labels.poll180}</MenuItem>
                  <MenuItem value="300">{labels.poll300}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth sx={compactFormSx}>
                <Select
                  value={feed.sortMode}
                  onChange={e => onSetFeedSortMode(feed, e.target.value as SortMode)}
                  disabled={!connected}
                >
                  <MenuItem value="newest">{labels.sortNewest}</MenuItem>
                  <MenuItem value="oldest">{labels.sortOldest}</MenuItem>
                  <MenuItem value="matched">{labels.sortMatched}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth sx={compactFormSx}>
                <Select
                  value={getFeedFilterPreset(feed.filters)}
                  onChange={e => onSetFeedFilterPreset(feed, e.target.value as FeedFilterPreset)}
                  disabled={!connected}
                >
                  <MenuItem value="all">{labels.filterAll}</MenuItem>
                  <MenuItem value="matches">{labels.filterMatches}</MenuItem>
                  <MenuItem value="researched">{labels.filterResearched}</MenuItem>
                  <MenuItem value="summaries">{labels.filterSummaries}</MenuItem>
                  <MenuItem value="matches_researched">{labels.filterMatchesResearched}</MenuItem>
                  <MenuItem value="matches_summaries">{labels.filterMatchesSummaries}</MenuItem>
                  <MenuItem value="researched_summaries">{labels.filterResearchedSummaries}</MenuItem>
                  <MenuItem value="all_flags">{labels.filterAllFlags}</MenuItem>
                </Select>
              </FormControl>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                onClick={() => onToggleAdvancedControls(feed.url)}
                sx={{ ...compactBtnSx, gridColumn: '1 / -1' }}
              >
                {advancedControlsOpen ? labels.lessOptions : labels.moreOptions}
              </Button>
              {advancedControlsOpen ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ gridColumn: '1 / -1' }}>
                  <FormControl size="small" fullWidth sx={compactFormSx}>
                    <Select
                      value={deleteAge}
                      onChange={e => onSetDeleteAge(feed.url, e.target.value as 'yesterday' | 'week' | 'month' | 'year')}
                    >
                      <MenuItem value="yesterday">{labels.deleteYesterday}</MenuItem>
                      <MenuItem value="week">{labels.deleteWeek}</MenuItem>
                      <MenuItem value="month">{labels.deleteMonth}</MenuItem>
                      <MenuItem value="year">{labels.deleteYear}</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => onRemoveOldInFeed(feed)}
                    sx={{ ...compactBtnSx, minWidth: { sm: 136 } }}
                  >
                    {labels.deleteOld}
                  </Button>
                </Stack>
              ) : null}
            </Box>
          ) : null}
          {!isHydrated ? (
            <Stack spacing={1.2} sx={{ py: 0.6 }}>
              <Skeleton variant="rounded" height={80} sx={{ bgcolor: 'rgba(120,140,180,0.14)' }} />
              <Skeleton variant="rounded" height={80} sx={{ bgcolor: 'rgba(120,140,180,0.14)' }} />
              <Alert severity="info" variant="outlined">Loading column...</Alert>
            </Stack>
          ) : (
            <Stack spacing={1.2}>
              {itemsVisible.length === 0 ? (
                <Alert severity="info" variant="outlined">
                  {items.length === 0 ? (isMatchColumn ? labels.waitingMatches : labels.waiting) : labels.noMatches}
                </Alert>
              ) : shownItems.map(it => {
                const askState = askByItem[askKey(it)] || {
                  open: false,
                  draft: '',
                  pending: false,
                  remaining: 5,
                  messages: []
                };
                const summaryKey = bodyKey(it, 'summary');
                const researchKey = bodyKey(it, 'research');
                const summaryResearchHidden = hideAllResearch || bodyModes[researchKey] === 'hidden';
                const savedSummaryMode = bodyModes[summaryKey];
                const summaryMode = summaryResearchHidden && savedSummaryMode === 'hidden'
                  ? getDefaultBodyMode(it.summary || '', 260)
                  : getBodyMode(summaryKey, it.summary || '', 260);
                const summaryLong = String(it.summary || '').trim().length > 260;
                const summaryText = summaryMode === 'collapsed' ? collapseText(it.summary || '', 260) : String(it.summary || '');
                const researchMode = getBodyMode(researchKey, it.research || '', 340);
                const researchLong = String(it.research || '').trim().length > 340;
                const researchText = researchMode === 'collapsed' ? compactResearch(it.research || '') : String(it.research || '');
                const researchConfidence = extractConfidence(it.research || '');
                return (
                  <NewsCard
                    key={it.id}
                    item={it}
                    askState={askState}
                    labels={cardLabels}
                    vibeIcons={vibeIcons}
                    compactBtnSx={compactBtnSx}
                    buttonMode={buttonMode}
                    aiAvailable={aiAvailable}
                    performanceMode={performanceMode}
                    fontScale={fontScale}
                    connected={connected}
                    hideAllResearch={hideAllResearch}
                    hideAllSummaries={hideAllSummaries}
                    summaryPending={!!summaryPendingById[it.id]}
                    researchPending={!!researchPendingById[it.id]}
                    isPinnedNews={!!pinnedNewsById[it.id]}
                    accent={accent}
                    soft={soft}
                    matchAccent={palette.m}
                    showAutoResearching={aiAvailable && feed.researchEnabled && aiEnabled && !it.research && !researchPendingById[it.id] && !hideAllResearch}
                    summaryMode={summaryMode}
                    summaryLong={summaryLong}
                    summaryText={summaryText}
                    researchMode={researchMode}
                    researchLong={researchLong}
                    researchText={researchText}
                    researchConfidence={researchConfidence}
                    onTogglePinnedNews={onTogglePinnedNews}
                    onCopyLink={onCopyLink}
                    onCopyNews={onCopyNewsPayload}
                    onHideItem={onHideItem}
                    onRequestSummary={onRequestSummary}
                    onRequestResearch={onRequestResearch}
                    onToggleAsk={onToggleAsk}
                    onSetSummaryMode={(mode: BodyMode) => setBodyMode(summaryKey, mode)}
                    onSetResearchMode={(mode: BodyMode) => setBodyMode(researchKey, mode)}
                    onAskDraft={onSetAskDraft}
                    onAskSubmit={onAskSubmit}
                  />
                );
              })}
              {itemsVisible.length > shownItems.length ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onShowMoreNews(feed.url)}
                >
                  {labels.showFiveMore}
                </Button>
              ) : null}
              {itemsVisible.length > 10 && shownItems.length > 10 ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => onResetNewsToTen(feed.url)}
                >
                  {labels.resetToTenItems}
                </Button>
              ) : null}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
