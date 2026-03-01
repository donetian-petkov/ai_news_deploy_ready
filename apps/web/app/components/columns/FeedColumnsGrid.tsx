'use client';

import type { DragEvent } from 'react';
import { Box } from '@mui/material';
import type { FeedInfo } from '../../store/types';
import { FILTERED_FEED_URL } from '../../store/constants';
import type { FeedColumnHandlers, FeedColumnStateModel, FeedColumnViewModel } from './reactColumns.types';
import { FeedColumn } from './FeedColumn';

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

type Props = {
  feeds: FeedInfo[];
  view: FeedColumnViewModel;
  state: FeedColumnStateModel;
  handlers: FeedColumnHandlers;
  onGridDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onGridDrop: (e: DragEvent<HTMLDivElement>) => void;
  buildDragState: (feed: FeedInfo, canDrag: boolean) => DragState;
};

export function FeedColumnsGrid({
  feeds,
  view,
  state,
  handlers,
  onGridDragOver,
  onGridDrop,
  buildDragState
}: Props) {
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
            view={view}
            state={state}
            handlers={handlers}
            drag={buildDragState(feed, canDrag)}
          />
        );
      })}
    </Box>
  );
}
