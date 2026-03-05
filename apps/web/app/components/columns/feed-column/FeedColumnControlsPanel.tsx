'use client';

import { Box } from '@mui/material';
import { FILTERED_FEED_URL } from '../../../store/constants';
import type { FeedInfo } from '../../../store/types';
import { useFeedColumnsContext } from '../context/useFeedColumnsContext';
import { FeedColumnAdvancedSettings } from './controls/FeedColumnAdvancedSettings';
import { FeedColumnAiSettings } from './controls/FeedColumnAiSettings';
import { FeedColumnCoreActions } from './controls/FeedColumnCoreActions';
import { FeedColumnGeneralSettings } from './controls/FeedColumnGeneralSettings';

type Props = {
  feed: FeedInfo;
};

export function FeedColumnControlsPanel({ feed }: Props) {
  const { state } = useFeedColumnsContext();
  const { hydratedColumns, controlsOpenByUrl, advancedControlsByUrl } = state;
  const isMatchColumn = feed.url === FILTERED_FEED_URL || String(feed.label || '').toLowerCase().startsWith('filtered');
  const isHydrated = !!hydratedColumns[feed.url];
  const controlsOpen = typeof controlsOpenByUrl[feed.url] === 'boolean' ? !!controlsOpenByUrl[feed.url] : true;
  const advancedControlsOpen = !!advancedControlsByUrl[feed.url];

  return (
    <>
      <FeedColumnCoreActions feed={feed} isMatchColumn={isMatchColumn} />

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
          <FeedColumnGeneralSettings feed={feed} />
          {advancedControlsOpen ? <FeedColumnAdvancedSettings feed={feed} /> : null}
        </Box>
      ) : null}
    </>
  );
}
