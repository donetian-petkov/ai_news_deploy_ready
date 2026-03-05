'use client';

import { useMemo } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTopMenuContext } from './context/useTopMenuContext';

export function HelpDialog() {
  const { t } = useTranslation();
  const { help } = useTopMenuContext();
  const shortcuts = useMemo(
    () => Object.values(t('help.shortcuts', { returnObjects: true }) as Record<string, string>),
    [t]
  );
  const dialogTitle = help.title;
  const closeText = help.closeLabel;

  return (
    <Dialog open={help.open} onClose={help.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        {shortcuts.map(shortcut => (
          <Typography key={shortcut} variant="body2">
            {shortcut}
          </Typography>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={help.onClose}>{closeText}</Button>
      </DialogActions>
    </Dialog>
  );
}
