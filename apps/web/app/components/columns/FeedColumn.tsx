'use client';

import { Box, Card, CardContent } from '@mui/material';
import type { FeedColumnDragState } from './reactColumns.types';
import { FeedColumnControlsPanel } from './feed-column/FeedColumnControlsPanel';
import { FeedColumnItemsList } from './feed-column/FeedColumnItemsList';
import { FeedColumnHeader } from './feed-column/FeedColumnHeader';
import { FeedColumnProvider } from './feed-column/context/FeedColumnProvider';
import { useFeedColumnModel } from './feed-column/hooks/useFeedColumnModel';
import { COLUMN_COLOR_TOKENS, COLUMN_LAYOUT_TOKENS, COLUMN_STYLE_TOKENS } from './designTokens';
import type { FeedInfo } from '../../store/types';

type FeedColumnProps = {
  feed: FeedInfo;
  columnIdx: number;
  drag: FeedColumnDragState;
};

export function FeedColumn({ feed, columnIdx, drag }: FeedColumnProps) {
  const {
    isMatchColumn,
    colTheme,
    accent,
    soft,
    fontScale,
    palette,
    performanceMode,
    items,
    itemsVisible,
    shownItems
  } = useFeedColumnModel({
    feed,
    columnIdx
  });

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
        <div className="columnOrnamentLayer" aria-hidden="true">
          <span className="frameTop" />
          <span className="frameBottom" />
          <span className="cornerTL" />
          <span className="cornerTR" />
          <span className="cornerBL" />
          <span className="cornerBR" />
          <span className="glyphTL" />
          <span className="glyphTR" />
          <span className="glyphBL" />
          <span className="glyphBR" />
        </div>
        <CardContent sx={{ pb: COLUMN_LAYOUT_TOKENS.cardContentPaddingBottom, px: COLUMN_LAYOUT_TOKENS.cardContentPaddingX }}>
          <FeedColumnProvider
            value={{
              feed,
              isMatchColumn,
              accent,
              soft,
              fontScale,
              items,
              itemsVisible,
              shownItems
            }}
          >
            <FeedColumnHeader />

            <FeedColumnControlsPanel />

            <FeedColumnItemsList />
          </FeedColumnProvider>
        </CardContent>
      </Card>
    </Box>
  );
}
