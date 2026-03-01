'use client';

import { Button, FormControl, MenuItem, Select } from '@mui/material';
import type { FeedInfo, SortMode } from '../../../../store/types';
import type { FeedFilterPreset } from '../../reactColumns.types';
import { getFeedFilterPreset } from '../../reactColumns.utils';
import { useFeedColumnsContext } from '../../context/FeedColumnsContext';

type Props = {
  feed: FeedInfo;
  advancedControlsOpen: boolean;
};

export function FeedColumnGeneralSettings({ feed, advancedControlsOpen }: Props) {
  const { view, handlers } = useFeedColumnsContext();
  const { connected, compactBtnSx, compactFormSx, labels } = view;
  const { onSetFeedInterval, onSetFeedSortMode, onSetFeedFilterPreset, onToggleAdvancedControls } = handlers;

  return (
    <>
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
    </>
  );
}
