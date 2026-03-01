'use client';

import { Box } from '@mui/material';
import type { FeedInfo } from '../../../store/types';
import { FeedColumnAdvancedSettings } from './controls/FeedColumnAdvancedSettings';
import { FeedColumnAiSettings } from './controls/FeedColumnAiSettings';
import { FeedColumnCoreActions } from './controls/FeedColumnCoreActions';
import { FeedColumnGeneralSettings } from './controls/FeedColumnGeneralSettings';

type Props = {
  feed: FeedInfo;
  isHydrated: boolean;
  isMatchColumn: boolean;
  controlsOpen: boolean;
  advancedControlsOpen: boolean;
  deleteAge: 'yesterday' | 'week' | 'month' | 'year';
  pinned: boolean;
};

export function FeedColumnControlsPanel({
  feed,
  isHydrated,
  isMatchColumn,
  controlsOpen,
  advancedControlsOpen,
  deleteAge,
  pinned
}: Props) {
  return (
    <>
      <FeedColumnCoreActions
        feed={feed}
        isMatchColumn={isMatchColumn}
        pinned={pinned}
        controlsOpen={controlsOpen}
      />

      {isHydrated && controlsOpen ? (
        <Box
          sx={{
            mb: 1.1,
            display: 'grid',
            gap: 0.8,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))'
            }
          }}
        >
          <FeedColumnAiSettings feed={feed} />
          <FeedColumnGeneralSettings feed={feed} advancedControlsOpen={advancedControlsOpen} />
          {advancedControlsOpen ? <FeedColumnAdvancedSettings feed={feed} deleteAge={deleteAge} /> : null}
        </Box>
      ) : null}
    </>
  );
}
