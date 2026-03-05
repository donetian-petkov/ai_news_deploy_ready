'use client';

import RedditIcon from '@mui/icons-material/Reddit';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import { Chip, Stack, Typography } from '@mui/material';
import { useFeedColumnContext } from './context/useFeedColumnContext';
import { COLUMN_COLOR_TOKENS, COLUMN_LAYOUT_TOKENS } from '../designTokens';

export function FeedColumnHeader() {
  const { feed, itemsVisible, accent, fontScale } = useFeedColumnContext();
  const itemsCount = itemsVisible.length;
  return (
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
        <Chip size="small" label={itemsCount} sx={{ color: COLUMN_COLOR_TOKENS.textChip, bgcolor: COLUMN_COLOR_TOKENS.chipBg, borderColor: accent }} />
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
  );
}
