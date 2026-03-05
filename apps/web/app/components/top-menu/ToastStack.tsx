'use client';

import { Alert, Box } from '@mui/material';
import { useTopMenuContext } from './context/useTopMenuContext';

export function ToastStack() {
  const { toast } = useTopMenuContext();
  const { toasts, onDismiss } = toast;
  if (!toasts.length) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 14,
        bottom: 14,
        zIndex: 2200,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        width: { xs: 'calc(100vw - 28px)', sm: 420 }
      }}
    >
      {toasts.map(t => (
        <Alert
          key={t.id}
          severity={t.kind}
          onClose={() => onDismiss(t.id)}
          variant="filled"
          sx={{ boxShadow: '0 8px 22px rgba(0,0,0,0.34)' }}
        >
          {t.message}
        </Alert>
      ))}
    </Box>
  );
}
