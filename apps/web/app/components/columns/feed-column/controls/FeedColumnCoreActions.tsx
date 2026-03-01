'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { Button, Stack } from '@mui/material';
import type { FeedInfo } from '../../../../store/types';
import { useFeedColumnsContext } from '../../context/FeedColumnsContext';

type Props = {
  feed: FeedInfo;
  isMatchColumn: boolean;
  pinned: boolean;
  controlsOpen: boolean;
};

export function FeedColumnCoreActions({ feed, isMatchColumn, pinned, controlsOpen }: Props) {
  const { view, handlers } = useFeedColumnsContext();
  const { connected, compactBtnSx, labels } = view;
  const { onTogglePinnedColumn, onRemoveFeed, onToggleFeedControls } = handlers;

  return (
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
  );
}
