'use client';

import { Alert, Box, Button, FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useTopMenuContext } from './context/useTopMenuContext';

export function AddStreamSection() {
  const { labels, addStream } = useTopMenuContext();
  const desktopTypeWidth = 'clamp(150px, calc(10ch + 48px), 196px)';
  const desktopIntervalWidth = 'clamp(132px, calc(8ch + 44px), 164px)';
  const desktopLabelWidth = 'clamp(180px, calc(15ch + 28px), 220px)';
  const desktopFixedControlSx = addStream.isMobile
    ? { minWidth: 0, width: '100%' }
    : { flex: '0 0 auto', flexShrink: 0 };
  const desktopSelectSx = addStream.isMobile ? undefined : {
    width: '100%',
    '& .MuiSelect-select': {
      whiteSpace: 'nowrap',
      textOverflow: 'clip',
      minWidth: '4ch'
    }
  };

  return (
    <Box className="topMenuAddStreamSection">
      <Stack direction={addStream.isMobile ? 'column' : { xs: 'column', md: 'row' }} spacing={1}>
        <FormControl
          className="topMenuAddStreamTypeControl"
          size={addStream.isMobile ? 'medium' : 'small'}
          sx={addStream.isMobile ? desktopFixedControlSx : { ...desktopFixedControlSx, flexBasis: desktopTypeWidth, width: desktopTypeWidth, minWidth: desktopTypeWidth }}
        >
          <Select
            value={addStream.feedType}
            onChange={e => addStream.onFeedTypeChange(e.target.value as typeof addStream.feedType)}
            sx={desktopSelectSx}
          >
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
          sx={addStream.isMobile ? { minWidth: 0 } : { flex: '1 1 420px', minWidth: 0 }}
        />
        <TextField
          size={addStream.isMobile ? 'medium' : 'small'}
          value={addStream.feedLabel}
          onChange={e => addStream.onFeedLabelChange(e.target.value)}
          placeholder={labels.addLabelPlaceholder}
          className="topMenuAddStreamLabelInput"
          sx={addStream.isMobile ? { minWidth: 0 } : { flex: `0 0 ${desktopLabelWidth}`, minWidth: desktopLabelWidth }}
        />
        <FormControl
          className="topMenuAddStreamIntervalControl"
          size={addStream.isMobile ? 'medium' : 'small'}
          sx={addStream.isMobile ? desktopFixedControlSx : { ...desktopFixedControlSx, flexBasis: desktopIntervalWidth, width: desktopIntervalWidth, minWidth: desktopIntervalWidth }}
        >
          <Select
            value={addStream.feedInterval}
            onChange={e => addStream.onFeedIntervalChange(String(e.target.value))}
            sx={desktopSelectSx}
          >
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
          sx={addStream.isMobile ? { minWidth: '100%' } : { flex: '0 0 auto', minWidth: 124, whiteSpace: 'nowrap' }}
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
