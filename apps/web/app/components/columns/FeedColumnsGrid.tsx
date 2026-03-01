'use client';

import { Box } from '@mui/material';
import type { FeedInfo } from '../../store/types';
import { FILTERED_FEED_URL } from '../../store/constants';
import { useFeedColumnsContext } from './context/FeedColumnsContext';
import { FeedColumn } from './FeedColumn';

type Props = {
  feeds: FeedInfo[];
};

export function FeedColumnsGrid({ feeds }: Props) {
  const {
    onGridDragOver,
    onGridDrop,
    buildDragState
  } = useFeedColumnsContext();

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        width: '100%',
        justifyItems: 'stretch',
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          sm: 'repeat(2, minmax(320px, 1fr))',
          lg: 'repeat(3, minmax(330px, 1fr))',
          xl: 'repeat(4, minmax(330px, 1fr))'
        }
      }}
      onDragOver={onGridDragOver}
      onDrop={onGridDrop}
    >
      {feeds.map((feed, columnIdx) => {
        const isMatchColumn = feed.url === FILTERED_FEED_URL || String(feed.label || '').toLowerCase().startsWith('filtered');
        const canDrag = !isMatchColumn;

        return (
          <FeedColumn
            key={feed.url}
            feed={feed}
            columnIdx={columnIdx}
            drag={buildDragState(feed, canDrag)}
          />
        );
      })}
    </Box>
  );
}
