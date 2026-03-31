'use client';

import { Box, Button, Stack, TextField } from '@mui/material';
import { useTopMenuContext } from './context/useTopMenuContext';

export function SearchSection() {
  const { labels, search } = useTopMenuContext();
  const rowDirection = search.isMobile ? 'column' : { xs: 'column', sm: 'row' } as const;

  return (
    <Box className="topMenuSearchSection">
      <Stack className="topMenuSearchRow" direction={rowDirection} spacing={1}>
        <TextField
          inputRef={search.searchInputRef}
          size={search.isMobile ? 'medium' : 'small'}
          fullWidth
          value={search.searchDraft}
          onChange={e => search.onSearchDraftChange(e.target.value)}
          placeholder={labels.searchPlaceholder}
        />
        <Button
          variant="outlined"
          size={search.isMobile ? 'medium' : 'small'}
          onClick={search.onClear}
          className={search.isMobile ? 'topMenuSearchClearBtn topMenuSearchClearBtnFull' : 'topMenuSearchClearBtn'}
        >
          {labels.clear}
        </Button>
      </Stack>
    </Box>
  );
}
