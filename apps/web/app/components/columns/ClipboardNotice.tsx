'use client';

import { Snackbar } from '@mui/material';
import { useFeedColumnsContext } from './context/useFeedColumnsContext';

export function ClipboardNotice() {
  const { clipboard } = useFeedColumnsContext();
  const { open, message, onClose } = clipboard;
  return (
    <Snackbar
      open={open}
      autoHideDuration={1400}
      onClose={onClose}
      message={message}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    />
  );
}
