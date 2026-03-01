'use client';

import type { RefObject } from 'react';
import { Alert, Box, Button, FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';

type AddStatus = { kind: 'info' | 'success' | 'error'; message: string } | null;

type AddStreamSectionProps = {
  isMobile: boolean;
  feedType: 'rss' | 'reddit' | 'youtube';
  feedUrl: string;
  feedLabel: string;
  feedInterval: string;
  addStatus: AddStatus;
  addStreamInputRef: RefObject<HTMLInputElement | null>;
  labels: Record<string, string>;
  onFeedTypeChange: (value: 'rss' | 'reddit' | 'youtube') => void;
  onFeedUrlChange: (value: string) => void;
  onFeedLabelChange: (value: string) => void;
  onFeedIntervalChange: (value: string) => void;
  onAddStream: () => void;
};

export function AddStreamSection({
  isMobile,
  feedType,
  feedUrl,
  feedLabel,
  feedInterval,
  addStatus,
  addStreamInputRef,
  labels,
  onFeedTypeChange,
  onFeedUrlChange,
  onFeedLabelChange,
  onFeedIntervalChange,
  onAddStream
}: AddStreamSectionProps) {
  return (
    <Box className="topMenuAddStreamSection">
      <Stack direction={isMobile ? 'column' : { xs: 'column', md: 'row' }} spacing={1}>
        <FormControl className="topMenuAddStreamTypeControl" size={isMobile ? 'medium' : 'small'}>
          <Select value={feedType} onChange={e => onFeedTypeChange(e.target.value as 'rss' | 'reddit' | 'youtube')}>
            <MenuItem value="rss">{labels.addStreamTypeRss}</MenuItem>
            <MenuItem value="reddit">{labels.addStreamTypeReddit}</MenuItem>
            <MenuItem value="youtube">{labels.addStreamTypeYoutube}</MenuItem>
          </Select>
        </FormControl>
        <TextField
          inputRef={addStreamInputRef}
          size={isMobile ? 'medium' : 'small'}
          fullWidth
          value={feedUrl}
          onChange={e => onFeedUrlChange(e.target.value)}
          placeholder={labels.addUrlPlaceholder}
        />
        <TextField
          size={isMobile ? 'medium' : 'small'}
          value={feedLabel}
          onChange={e => onFeedLabelChange(e.target.value)}
          placeholder={labels.addLabelPlaceholder}
          className="topMenuAddStreamLabelInput"
        />
        <FormControl className="topMenuAddStreamIntervalControl" size={isMobile ? 'medium' : 'small'}>
          <Select value={feedInterval} onChange={e => onFeedIntervalChange(String(e.target.value))}>
            <MenuItem value="45">45{labels.intervalSuffix}</MenuItem>
            <MenuItem value="60">60{labels.intervalSuffix}</MenuItem>
            <MenuItem value="90">90{labels.intervalSuffix}</MenuItem>
            <MenuItem value="120">120{labels.intervalSuffix}</MenuItem>
            <MenuItem value="180">180{labels.intervalSuffix}</MenuItem>
            <MenuItem value="300">300{labels.intervalSuffix}</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          size={isMobile ? 'medium' : 'small'}
          onClick={onAddStream}
          className={isMobile ? 'topMenuAddStreamBtn topMenuAddStreamBtnMobile' : 'topMenuAddStreamBtn'}
        >
          {labels.add}
        </Button>
      </Stack>
      {addStatus ? (
        <Alert className="topMenuAddStreamStatusAlert" severity={addStatus.kind}>
          {addStatus.message}
        </Alert>
      ) : null}
    </Box>
  );
}
