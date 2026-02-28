'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

type HelpDialogProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
};

const SHORTCUTS = [
  '`?` / `H`: Help',
  '`M`: Toggle menu',
  '`C`: Toggle top controls',
  '`G`: Toggle all column controls',
  '`S`: Toggle search section',
  '`/`: Focus search',
  '`A`: Toggle add stream section',
  '`T`: Cycle color mode',
  '`V`: Cycle vibe',
  '`Esc`: Close help'
];

export function HelpDialog({ open, title, closeLabel, onClose }: HelpDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {SHORTCUTS.map(shortcut => (
          <Typography key={shortcut} variant="body2">
            {shortcut}
          </Typography>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{closeLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
