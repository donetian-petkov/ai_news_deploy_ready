'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Button, FormControl, MenuItem, Select, Stack } from '@mui/material';
import type { FeedInfo } from '../../../../store/types';
import { useFeedColumnsContext } from '../../context/useFeedColumnsContext';

type Props = {
  feed: FeedInfo;
};

export function FeedColumnAdvancedSettings({ feed }: Props) {
  const { view, state, handlers } = useFeedColumnsContext();
  const { compactBtnSx, compactFormSx, labels } = view;
  const { onSetDeleteAge, onRemoveOldInFeed } = handlers;
  const deleteAge = state.deleteAgeByUrl[feed.url] || 'week';

  return (
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
  );
}
