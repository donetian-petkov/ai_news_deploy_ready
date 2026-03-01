'use client';

import RedditIcon from '@mui/icons-material/Reddit';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { NewsMoodFilterValue, NewsTypeFilterValue, type FeedInfo } from '../../store/types';
import { FILTERED_FEED_URL } from '../../store/constants';
import type { FeedColumnDragState } from './reactColumns.types';
import { useFeedColumnsContext } from './context/FeedColumnsContext';
import { FeedColumnControlsPanel } from './feed-column/FeedColumnControlsPanel';
import { FeedColumnItemsList } from './feed-column/FeedColumnItemsList';
import { COLUMN_COLOR_TOKENS, COLUMN_LAYOUT_TOKENS, COLUMN_STYLE_TOKENS } from './designTokens';

type FeedColumnProps = {
  feed: FeedInfo;
  columnIdx: number;
  drag: FeedColumnDragState;
};

export function FeedColumn({
  feed,
  columnIdx,
  drag
}: FeedColumnProps) {
  const {
    view,
    state
  } = useFeedColumnsContext();

  const {
    palette,
    performanceMode,
    moodFilter,
    typeFilter,
    searchQuery,
    fontScale
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
  const moodFilterEffective = performanceMode ? NewsMoodFilterValue.All : moodFilter;
  const typeFilterEffective = performanceMode ? NewsTypeFilterValue.All : typeFilter;
  const moodFilteredItems = moodFilterEffective === NewsMoodFilterValue.All
    ? items
    : items.filter(it => it.mood === moodFilterEffective);
  const typeFilteredItems = typeFilterEffective === NewsTypeFilterValue.All
    ? moodFilteredItems
    : moodFilteredItems.filter(it => it.newsType === typeFilterEffective);
  const normalizedQuery = String(searchQuery || '').trim().toLowerCase();
  const itemsVisible = normalizedQuery
    ? typeFilteredItems.filter(it => {
      const hay = `${it.title}\n${it.summary || ''}\n${it.research || ''}`.toLowerCase();
      return hay.includes(normalizedQuery);
    })
    : typeFilteredItems;

  const visibleLimit = Math.max(COLUMN_LAYOUT_TOKENS.initialVisibleItems, visibleByFeed[feed.url] || COLUMN_LAYOUT_TOKENS.initialVisibleItems);
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
            ? (isMatchColumn ? COLUMN_COLOR_TOKENS.perfBackgroundMatch : COLUMN_COLOR_TOKENS.perfBackgroundDefault)
            : (isMatchColumn
              ? `linear-gradient(180deg, ${palette.mSoft}, ${COLUMN_COLOR_TOKENS.gradientMatchMid} 74%, ${COLUMN_COLOR_TOKENS.gradientMatchEnd} 100%), var(--column-shell-overlay)`
              : `linear-gradient(180deg, ${soft}, ${COLUMN_COLOR_TOKENS.gradientDefaultEnd} 78%), var(--column-shell-overlay)`),
          borderColor: drag.isDropTarget
            ? accent
            : (drag.isDragging ? accent : (isMatchColumn ? `${palette.m}` : COLUMN_COLOR_TOKENS.borderNeutral)),
          borderTop: `${COLUMN_STYLE_TOKENS.columnBorderTopWidthPx}px solid ${isMatchColumn ? palette.m : accent}`,
          boxShadow: performanceMode
            ? (drag.isDropTarget ? `0 0 0 ${COLUMN_STYLE_TOKENS.columnDropOutlineWidthPx}px ${accent}` : 'none')
            : (drag.isDropTarget
              ? `0 0 0 ${COLUMN_STYLE_TOKENS.columnDropOutlineStrongWidthPx}px ${accent}66, ${COLUMN_STYLE_TOKENS.columnDropShadowOffset} ${COLUMN_COLOR_TOKENS.shadowDropColor}`
              : (isMatchColumn
                ? `${COLUMN_STYLE_TOKENS.columnMatchShadowOffset} ${COLUMN_COLOR_TOKENS.shadowDropColor}, inset 0 0 0 ${COLUMN_STYLE_TOKENS.columnDropOutlineWidthPx}px ${COLUMN_COLOR_TOKENS.shadowMatchInset}`
                : `${COLUMN_STYLE_TOKENS.columnDefaultShadowOffset} ${COLUMN_COLOR_TOKENS.shadowDefaultColor}`)),
          borderRadius: COLUMN_STYLE_TOKENS.columnRadius,
          color: COLUMN_COLOR_TOKENS.textMain,
          opacity: drag.isDragging ? COLUMN_STYLE_TOKENS.columnDragOpacity : 1,
          transform: drag.isDragging ? `scale(${COLUMN_STYLE_TOKENS.columnDragScale})` : (drag.isDropTarget ? `translateY(${COLUMN_STYLE_TOKENS.columnDropTranslateYPx}px)` : 'translateY(0)'),
          transition: performanceMode
            ? 'none'
            : `transform ${COLUMN_LAYOUT_TOKENS.transitionMs}ms ${COLUMN_STYLE_TOKENS.transitionEasing}, box-shadow ${COLUMN_LAYOUT_TOKENS.transitionMs}ms ${COLUMN_STYLE_TOKENS.transitionEasing}, opacity ${COLUMN_LAYOUT_TOKENS.transitionMs}ms ${COLUMN_STYLE_TOKENS.transitionEasing}, border-color ${COLUMN_LAYOUT_TOKENS.transitionMs}ms ${COLUMN_STYLE_TOKENS.transitionEasing}`,
          cursor: drag.canDrag ? (drag.isDragging ? 'grabbing' : 'grab') : 'default'
        }}
      >
        <CardContent sx={{ pb: COLUMN_LAYOUT_TOKENS.cardContentPaddingBottom, px: COLUMN_LAYOUT_TOKENS.cardContentPaddingX }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: COLUMN_LAYOUT_TOKENS.columnHeaderMarginBottom }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: `${COLUMN_LAYOUT_TOKENS.columnTitleFontSizePx * fontScale}px`,
                fontWeight: 800,
                lineHeight: COLUMN_LAYOUT_TOKENS.columnTitleLineHeight,
                pr: 1,
                pl: COLUMN_LAYOUT_TOKENS.columnTitlePaddingLeft,
                color: COLUMN_COLOR_TOKENS.textTitle,
                fontFamily: 'var(--news-title-font-family, var(--font-family))'
              }}
            >
              {feed.label}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={itemsVisible.length} sx={{ color: COLUMN_COLOR_TOKENS.textChip, bgcolor: COLUMN_COLOR_TOKENS.chipBg, borderColor: accent }} />
              <Chip
                size="small"
                variant="outlined"
                icon={feed.kind === 'youtube' ? <SmartDisplayIcon /> : feed.kind === 'reddit' ? <RedditIcon /> : <RssFeedIcon />}
                label=""
                sx={{
                  color: COLUMN_COLOR_TOKENS.textChip,
                  borderColor: accent,
                  '& .MuiChip-label': { px: 0.2 },
                  '& .MuiChip-icon': { color: COLUMN_COLOR_TOKENS.textChip, ml: 0.5, mr: 0.1, fontSize: COLUMN_LAYOUT_TOKENS.streamTypeIconFontSizePx }
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
          />
        </CardContent>
      </Card>
    </Box>
  );
}
