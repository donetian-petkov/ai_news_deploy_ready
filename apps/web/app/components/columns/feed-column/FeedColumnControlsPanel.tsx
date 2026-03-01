'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TuneIcon from '@mui/icons-material/Tune';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import {
  Alert,
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack
} from '@mui/material';
import type { BudgetMode, FeedInfo, SortMode } from '../../../store/types';
import type { FeedColumnHandlers, FeedFilterPreset } from '../reactColumns.types';
import { getFeedFilterPreset } from '../reactColumns.utils';

type Props = {
  feed: FeedInfo;
  isMatchColumn: boolean;
  isHydrated: boolean;
  controlsOpen: boolean;
  advancedControlsOpen: boolean;
  deleteAge: 'yesterday' | 'week' | 'month' | 'year';
  pinned: boolean;
  connected: boolean;
  aiAvailable: boolean;
  compactBtnSx: Record<string, unknown>;
  compactFormSx: Record<string, unknown>;
  labels: Record<string, string>;
  handlers: Pick<
    FeedColumnHandlers,
    | 'onTogglePinnedColumn'
    | 'onRemoveFeed'
    | 'onToggleFeedControls'
    | 'onToggleFeedSummary'
    | 'onToggleFeedResearch'
    | 'onSetFeedBudget'
    | 'onSetFeedInterval'
    | 'onSetFeedSortMode'
    | 'onSetFeedFilterPreset'
    | 'onToggleAdvancedControls'
    | 'onSetDeleteAge'
    | 'onRemoveOldInFeed'
  >;
};

export function FeedColumnControlsPanel({
  feed,
  isMatchColumn,
  isHydrated,
  controlsOpen,
  advancedControlsOpen,
  deleteAge,
  pinned,
  connected,
  aiAvailable,
  compactBtnSx,
  compactFormSx,
  labels,
  handlers
}: Props) {
  const {
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
    onRemoveOldInFeed
  } = handlers;

  return (
    <>
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
    </>
  );
}
