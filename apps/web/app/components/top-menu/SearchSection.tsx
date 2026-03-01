'use client';

import type { RefObject } from 'react';
import { Box, Button, Stack, TextField } from '@mui/material';

type SearchSectionProps = {
  isMobile: boolean;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onClear: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  labels: Record<string, string>;
};

export function SearchSection({
  isMobile,
  searchDraft,
  onSearchDraftChange,
  onClear,
  searchInputRef,
  labels
}: SearchSectionProps) {
  return (
    <Box className="topMenuSearchSection">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          inputRef={searchInputRef}
          size={isMobile ? 'medium' : 'small'}
          fullWidth
          value={searchDraft}
          onChange={e => onSearchDraftChange(e.target.value)}
          placeholder={labels.searchPlaceholder}
        />
        <Button
          variant="outlined"
          size={isMobile ? 'medium' : 'small'}
          onClick={onClear}
          className={isMobile ? 'topMenuSearchClearBtn topMenuSearchClearBtnFull' : 'topMenuSearchClearBtn'}
        >
          {labels.clear}
        </Button>
      </Stack>
    </Box>
  );
}
