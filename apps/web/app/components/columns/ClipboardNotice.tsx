'use client';

import { Snackbar } from '@mui/material';

type Props = {
  open: boolean;
  message: string;
  onClose: () => void;
};

export function ClipboardNotice({ open, message, onClose }: Props) {
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
