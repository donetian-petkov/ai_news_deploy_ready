'use client';

import { Alert, Button, FormControl, MenuItem, Select } from '@mui/material';
import type { BudgetMode } from '../../../../store/types';
import { useFeedColumnsContext } from '../../context/useFeedColumnsContext';
import { useFeedColumnContext } from '../context/useFeedColumnContext';

export function FeedColumnAiSettings() {
  const { feed } = useFeedColumnContext();
  const { view, handlers } = useFeedColumnsContext();
  const { aiAvailable, connected, compactBtnSx, compactFormSx, labels } = view;
  const { onToggleFeedSummary, onToggleFeedResearch, onSetFeedBudget } = handlers;

  if (!aiAvailable) {
    return (
      <Alert severity="info" variant="outlined" sx={{ gridColumn: '1 / -1' }}>
        {labels.aiUnavailable}
      </Alert>
    );
  }

  return (
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
  );
}
