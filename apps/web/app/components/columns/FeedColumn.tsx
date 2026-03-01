'use client';

import type { DragEvent } from 'react';
import RedditIcon from '@mui/icons-material/Reddit';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { FeedInfo } from '../../store/types';
import { FILTERED_FEED_URL } from '../../store/constants';
import type { FeedColumnHandlers, FeedColumnStateModel, FeedColumnViewModel } from './reactColumns.types';
import { FeedColumnControlsPanel } from './feed-column/FeedColumnControlsPanel';
import { FeedColumnItemsList } from './feed-column/FeedColumnItemsList';

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
  view: FeedColumnViewModel;
  state: FeedColumnStateModel;
  handlers: FeedColumnHandlers;
  drag: DragState;
};

export function FeedColumn({
  feed,
  columnIdx,
  view,
  state,
  handlers,
  drag
}: FeedColumnProps) {
  const {
    palette,
    performanceMode,
    moodFilter,
    typeFilter,
    searchQuery,
    fontScale,
    connected
  } = view;

  const {
    filteredColumnItems,
    itemsByFeed,
    visibleByFeed,
    hydratedColumns,
    pinnedByUrl,
    controlsOpenByUrl,
    advancedControlsByUrl,
    deleteAgeByUrl
  } = state;

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

  const visibleLimit = Math.max(10, visibleByFeed[feed.url] || 10);
  const shownItems = itemsVisible.slice(0, visibleLimit);
  const isHydrated = !!hydratedColumns[feed.url];
  const pinned = !!pinnedByUrl[feed.url];
  const controlsOpen = typeof controlsOpenByUrl[feed.url] === 'boolean' ? !!controlsOpenByUrl[feed.url] : true;
  const advancedControlsOpen = !!advancedControlsByUrl[feed.url];
  const deleteAge = deleteAgeByUrl[feed.url] || 'week';

  return (
    <Box
      key={feed.url}
      data-feed-url={feed.url}
      sx={{ width: '100%', minWidth: 0, mx: 'auto' }}
      draggable={drag.canDrag}
      onDragStart={drag.onDragStart}
      onDragEnd={drag.onDragEnd}
      ref={drag.setNode}
      onDragEnter={drag.onDragEnter}
      onDragOver={drag.onDragOver}
      onDrop={drag.onDrop}
    >
      <Card
        className="feed-column-shell"
        data-column-theme={colTheme}
        variant="outlined"
        sx={{
          '--ornament-accent': isMatchColumn ? palette.m : accent,
          '--ornament-soft': soft,
          position: 'relative',
          overflow: 'hidden',
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

          <FeedColumnControlsPanel
            feed={feed}
            isMatchColumn={isMatchColumn}
            isHydrated={isHydrated}
            controlsOpen={controlsOpen}
            advancedControlsOpen={advancedControlsOpen}
            deleteAge={deleteAge}
            pinned={pinned}
            connected={connected}
            aiAvailable={view.aiAvailable}
            compactBtnSx={view.compactBtnSx}
            compactFormSx={view.compactFormSx}
            labels={view.labels}
            handlers={handlers}
          />

          <FeedColumnItemsList
            feed={feed}
            items={items}
            itemsVisible={itemsVisible}
            shownItems={shownItems}
            isMatchColumn={isMatchColumn}
            accent={accent}
            soft={soft}
            isHydrated={isHydrated}
            view={view}
            state={state}
            handlers={handlers}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
