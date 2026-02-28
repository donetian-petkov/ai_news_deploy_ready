'use client';

import { useMemo } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type HelpDialogProps = {
  open: boolean;
  title?: string;
  closeLabel?: string;
  onClose: () => void;
};

export function HelpDialog({ open, title, closeLabel, onClose }: HelpDialogProps) {
  const { t } = useTranslation();
  const shortcuts = useMemo(
    () => Object.values(t('help.shortcuts', { returnObjects: true }) as Record<string, string>),
    [t]
  );
  const dialogTitle = title ?? t('topMenu.helpTitle');
  const closeText = closeLabel ?? t('topMenu.close');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        {shortcuts.map(shortcut => (
          <Typography key={shortcut} variant="body2">
            {shortcut}
          </Typography>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{closeText}</Button>
      </DialogActions>
    </Dialog>
  );
}
