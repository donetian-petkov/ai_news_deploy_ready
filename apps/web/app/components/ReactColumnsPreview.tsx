'use client';

import { Box } from '@mui/material';
import { FeedColumnsProvider } from './columns/context/FeedColumnsProvider';
import { FeedColumnsGrid } from './columns/FeedColumnsGrid';
import { useReactColumnsPreviewController } from './columns/hooks/useReactColumnsPreviewController';
import { ReactColumnsHeader } from './columns/ReactColumnsHeader';
import { ClipboardNotice } from './columns/ClipboardNotice';
import { NewsAccessGate } from './NewsAccessGate';

type Props = {
  wsUrl: string;
};

export default function ReactColumnsPreview({ wsUrl }: Props) {
  const { columnsContextValue } = useReactColumnsPreviewController({ wsUrl });

  return (
    <Box className="container" sx={{ pt: 1, pb: 0.5, position: 'relative' }}>
      <FeedColumnsProvider value={columnsContextValue}>
        <ReactColumnsHeader />
        <FeedColumnsGrid />
        <ClipboardNotice />
        <NewsAccessGate />
      </FeedColumnsProvider>
    </Box>
  );
}
