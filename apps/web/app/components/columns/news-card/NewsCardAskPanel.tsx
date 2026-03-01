'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import type { NewsCardProps } from '../reactColumns.types';

type Props = {
  item: NewsCardProps['item'];
  askState: NewsCardProps['askState'];
  labels: NewsCardProps['labels'];
  aiAvailable: boolean;
  performanceMode: boolean;
  connected: boolean;
  onAskDraft: NewsCardProps['onAskDraft'];
  onAskSubmit: NewsCardProps['onAskSubmit'];
};

export function NewsCardAskPanel({
  item,
  askState,
  labels,
  aiAvailable,
  performanceMode,
  connected,
  onAskDraft,
  onAskSubmit
}: Props) {
  if (!askState.open || !aiAvailable) return null;

  return (
    <Box sx={{ mt: 1.1, p: 1, border: '1px solid rgba(106,128,162,0.4)', borderRadius: performanceMode ? 1 : 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
        <Typography variant="caption" sx={{ color: 'rgba(210,219,235,0.74)' }}>
          {labels.askAgent}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(188,203,229,0.75)' }}>
          {labels.questionsLeft}: {askState.remaining}
        </Typography>
      </Stack>
      <Stack spacing={0.8} sx={{ mb: 0.8, maxHeight: 180, overflow: 'auto' }}>
        {askState.messages.map((m, idx) => (
          <Box key={`${idx}-${m.q.slice(0, 18)}`}>
            <Typography variant="caption" sx={{ color: 'rgba(146,204,255,0.92)', display: 'block' }}>
              Q: {m.q}
            </Typography>
            <Typography variant="caption" sx={{ color: m.error ? 'rgba(255,168,168,0.95)' : 'rgba(216,227,246,0.92)', display: 'block' }}>
              A: {m.error || m.a || '...'}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          placeholder={labels.askPlaceholder}
          value={askState.draft}
          onChange={e => onAskDraft(item.id, item.feedUrl, e.target.value.slice(0, 400))}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAskSubmit(item);
            }
          }}
        />
        <Button
          size="small"
          variant="contained"
          onClick={() => onAskSubmit(item)}
          disabled={!connected || askState.pending || askState.remaining <= 0 || !String(askState.draft || '').trim()}
        >
          {askState.pending ? labels.thinking : labels.send}
        </Button>
      </Stack>
    </Box>
  );
}
