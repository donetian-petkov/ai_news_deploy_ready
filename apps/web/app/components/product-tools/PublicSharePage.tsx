'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Container, Stack, Typography } from '@mui/material';
import { publicApiRequest } from './productToolsApi';

export function PublicSharePage({ token }: { token: string }) {
  const [item, setItem] = useState<any | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    publicApiRequest<{ item: any }>(`/api/share/${encodeURIComponent(token)}`)
      .then(result => setItem(result.item))
      .catch(err => setError((err as Error).message));
  }, [token]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Button component={Link} href="/" variant="outlined" sx={{ alignSelf: 'flex-start' }}>Back to news</Button>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {item ? (
          <Box sx={{ border: '1px solid var(--panel-border)', borderRadius: 2, p: 3 }}>
            <Typography variant="overline">{item.kind}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>{item.title}</Typography>
            <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', m: 0 }}>
              {typeof item.payload?.body === 'string' ? item.payload.body : JSON.stringify(item.payload, null, 2)}
            </Box>
          </Box>
        ) : !error ? (
          <Typography color="text.secondary">Loading share...</Typography>
        ) : null}
      </Stack>
    </Container>
  );
}
