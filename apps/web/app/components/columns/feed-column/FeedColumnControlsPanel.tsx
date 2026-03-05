'use client';

import { Box } from '@mui/material';
import { useFeedColumnsContext } from '../context/useFeedColumnsContext';
import { useFeedColumnContext } from './context/useFeedColumnContext';
import { FeedColumnAdvancedSettings } from './controls/FeedColumnAdvancedSettings';
import { FeedColumnAiSettings } from './controls/FeedColumnAiSettings';
import { FeedColumnCoreActions } from './controls/FeedColumnCoreActions';
import { FeedColumnGeneralSettings } from './controls/FeedColumnGeneralSettings';

export function FeedColumnControlsPanel() {
  const { state } = useFeedColumnsContext();
  const { feed } = useFeedColumnContext();
  const { hydratedColumns, controlsOpenByUrl, advancedControlsByUrl } = state;
  const isHydrated = !!hydratedColumns[feed.url];
  const controlsOpen = typeof controlsOpenByUrl[feed.url] === 'boolean' ? !!controlsOpenByUrl[feed.url] : true;
  const advancedControlsOpen = !!advancedControlsByUrl[feed.url];

  return (
    <>
      <FeedColumnCoreActions />

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
          <FeedColumnAiSettings />
          <FeedColumnGeneralSettings />
          {advancedControlsOpen ? <FeedColumnAdvancedSettings /> : null}
        </Box>
      ) : null}
    </>
  );
}
