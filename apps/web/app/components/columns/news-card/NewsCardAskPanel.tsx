'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { COLUMN_LAYOUT_TOKENS, NEWS_CARD_COLOR_TOKENS } from '../designTokens';
import { useNewsCardContext } from './context/useNewsCardContext';

export function NewsCardAskPanel() {
  const {
    view,
    state,
    handlers
  } = useNewsCardContext();

  const { labels, aiAvailable, performanceMode, connected } = view;
  const { item, askState } = state;
  const { onAskDraft, onAskSubmit } = handlers;

  if (!askState.open || !aiAvailable) return null;

  return (
    <Box sx={{ mt: 1.1, p: 1, border: `1px solid ${NEWS_CARD_COLOR_TOKENS.askPanelBorder}`, borderRadius: performanceMode ? 1 : 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
        <Typography variant="caption" sx={{ color: NEWS_CARD_COLOR_TOKENS.askHeaderText }}>
          {labels.askAgent}
        </Typography>
        <Typography variant="caption" sx={{ color: NEWS_CARD_COLOR_TOKENS.askCounterText }}>
          {labels.questionsLeft}: {askState.remaining}
        </Typography>
      </Stack>
      <Stack spacing={0.8} sx={{ mb: 0.8, maxHeight: 180, overflow: 'auto' }}>
        {askState.messages.map((m, idx) => (
          <Box key={`${idx}-${m.q.slice(0, 18)}`}>
            <Typography variant="caption" sx={{ color: NEWS_CARD_COLOR_TOKENS.askQuestionText, display: 'block' }}>
              Q: {m.q}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: m.error ? NEWS_CARD_COLOR_TOKENS.askErrorText : NEWS_CARD_COLOR_TOKENS.askAnswerText, display: 'block' }}
            >
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
          onChange={e => onAskDraft(item.id, item.feedUrl, e.target.value.slice(0, COLUMN_LAYOUT_TOKENS.askQuestionMaxLength))}
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
