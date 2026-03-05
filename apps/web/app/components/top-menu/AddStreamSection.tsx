'use client';

import { Alert, Box, Button, FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useTopMenuContext } from './context/useTopMenuContext';

export function AddStreamSection() {
  const { labels, addStream } = useTopMenuContext();

  return (
    <Box className="topMenuAddStreamSection">
      <Stack direction={addStream.isMobile ? 'column' : { xs: 'column', md: 'row' }} spacing={1}>
        <FormControl className="topMenuAddStreamTypeControl" size={addStream.isMobile ? 'medium' : 'small'}>
          <Select value={addStream.feedType} onChange={e => addStream.onFeedTypeChange(e.target.value as typeof addStream.feedType)}>
            <MenuItem value="rss">{labels.addStreamTypeRss}</MenuItem>
            <MenuItem value="reddit">{labels.addStreamTypeReddit}</MenuItem>
            <MenuItem value="youtube">{labels.addStreamTypeYoutube}</MenuItem>
          </Select>
        </FormControl>
        <TextField
          inputRef={addStream.addStreamInputRef}
          size={addStream.isMobile ? 'medium' : 'small'}
          fullWidth
          value={addStream.feedUrl}
          onChange={e => addStream.onFeedUrlChange(e.target.value)}
          placeholder={labels.addUrlPlaceholder}
        />
        <TextField
          size={addStream.isMobile ? 'medium' : 'small'}
          value={addStream.feedLabel}
          onChange={e => addStream.onFeedLabelChange(e.target.value)}
          placeholder={labels.addLabelPlaceholder}
          className="topMenuAddStreamLabelInput"
        />
        <FormControl className="topMenuAddStreamIntervalControl" size={addStream.isMobile ? 'medium' : 'small'}>
          <Select value={addStream.feedInterval} onChange={e => addStream.onFeedIntervalChange(String(e.target.value))}>
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
          size={addStream.isMobile ? 'medium' : 'small'}
          onClick={addStream.onAddStream}
          className={addStream.isMobile ? 'topMenuAddStreamBtn topMenuAddStreamBtnMobile' : 'topMenuAddStreamBtn'}
        >
          {labels.add}
        </Button>
      </Stack>
      {addStream.addStatus ? (
        <Alert className="topMenuAddStreamStatusAlert" severity={addStream.addStatus.kind}>
          {addStream.addStatus.message}
        </Alert>
      ) : null}
    </Box>
  );
}
