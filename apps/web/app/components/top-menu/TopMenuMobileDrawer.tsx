'use client';

import type { ReactNode } from 'react';
import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { QuickVibeSelect } from './QuickVibeSelect';
import type { FeedInfo } from '../../store/types';
import type { TopMenuVibe } from './topMenu.services';
import { FILTERED_FEED_URL } from '../../store/constants';

type TopMenuMobileDrawerProps = {
  open: boolean;
  labels: Record<string, string>;
  vibe: TopMenuVibe;
  searchLabel: string;
  addStreamLabel: string;
  controlsLabel: string;
  allColumnLabel: string;
  hideAllResearchLabel: string;
  hideAllSummariesLabel: string;
  orderedFeeds: FeedInfo[];
  searchVisible: boolean;
  addStreamVisible: boolean;
  searchSection: ReactNode;
  addStreamSection: ReactNode;
  controlsPanel: ReactNode;
  onClose: () => void;
  onChangeVibe: (nextVibe: TopMenuVibe) => void;
  onToggleSearch: () => void;
  onToggleAddStream: () => void;
  onToggleControls: () => void;
  onToggleAllColumnControls: () => void;
  onToggleHideAllResearch: () => void;
  onToggleHideAllSummaries: () => void;
  onReorderFeeds: (fromUrl: string, toUrl: string) => void;
};

export function TopMenuMobileDrawer({
  open,
  labels,
  vibe,
  searchLabel,
  addStreamLabel,
  controlsLabel,
  allColumnLabel,
  hideAllResearchLabel,
  hideAllSummariesLabel,
  orderedFeeds,
  searchVisible,
  addStreamVisible,
  searchSection,
  addStreamSection,
  controlsPanel,
  onClose,
  onChangeVibe,
  onToggleSearch,
  onToggleAddStream,
  onToggleControls,
  onToggleAllColumnControls,
  onToggleHideAllResearch,
  onToggleHideAllSummaries,
  onReorderFeeds
}: TopMenuMobileDrawerProps) {
  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ className: 'mobileDrawerPaper' }}>
      <Box className="mobileDrawerHeader">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>{labels.title}</Typography>
        <IconButton onClick={onClose} sx={{ color: 'var(--text-main)' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: 'var(--panel-border)' }} />
      <Box sx={{ p: 1.4, overflowY: 'auto' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <QuickVibeSelect value={vibe} labels={labels} fullWidth onChange={onChangeVibe} />
        </Stack>
        <Stack spacing={1}>
          <Button variant="outlined" onClick={onToggleSearch} startIcon={<SearchIcon fontSize="small" />}>
            {searchLabel}
          </Button>
          <Button variant="outlined" onClick={onToggleAddStream} startIcon={<AddIcon fontSize="small" />}>
            {addStreamLabel}
          </Button>
          <Button variant="outlined" onClick={onToggleControls} startIcon={<TuneIcon fontSize="small" />}>
            {controlsLabel}
          </Button>
          <Button variant="outlined" onClick={onToggleAllColumnControls}>
            {allColumnLabel}
          </Button>
          <Button variant="outlined" onClick={onToggleHideAllResearch}>
            {hideAllResearchLabel}
          </Button>
          <Button variant="outlined" onClick={onToggleHideAllSummaries}>
            {hideAllSummariesLabel}
          </Button>
        </Stack>
        <Box sx={{ mt: 1.4, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.8, color: 'var(--text-muted)', fontWeight: 800 }}>
            {labels.reorderColumns}
          </Typography>
          <Stack spacing={0.7}>
            {orderedFeeds.map((feed, idx) => {
              const isFixed = feed.url === FILTERED_FEED_URL;
              const prev = orderedFeeds[idx - 1];
              const next = orderedFeeds[idx + 1];
              const canMoveUp = !isFixed && !!prev && prev.url !== FILTERED_FEED_URL;
              const canMoveDown = !isFixed && !!next;
              return (
                <Stack
                  key={`mobile-order-${feed.url}`}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    p: 0.8,
                    border: '1px solid var(--panel-border)',
                    borderRadius: '12px',
                    background: 'var(--field-bg)'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, pr: 1 }}>
                    {feed.label}
                  </Typography>
                  <Stack direction="row" spacing={0.4}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (!canMoveUp || !prev) return;
                        onReorderFeeds(feed.url, prev.url);
                      }}
                      disabled={!canMoveUp}
                      aria-label={labels.moveUp}
                      sx={{ border: '1px solid var(--panel-border)', borderRadius: '10px' }}
                    >
                      <ArrowUpwardIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (!canMoveDown || !next) return;
                        onReorderFeeds(feed.url, next.url);
                      }}
                      disabled={!canMoveDown}
                      aria-label={labels.moveDown}
                      sx={{ border: '1px solid var(--panel-border)', borderRadius: '10px' }}
                    >
                      <ArrowDownwardIcon fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </Box>
        {searchVisible ? searchSection : null}
        {addStreamVisible ? addStreamSection : null}
        {controlsPanel}
      </Box>
    </Drawer>
  );
}
