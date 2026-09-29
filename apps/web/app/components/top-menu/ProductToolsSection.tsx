'use client';

import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';

const tools = [
  ['Library', '/library'],
  ['History', '/history'],
  ['Sources', '/sources'],
  ['Collections', '/collections'],
  ['Rules', '/rules'],
  ['Schedules', '/schedules'],
  ['Digests', '/digests'],
  ['Import / Export', '/import-export']
] as const;

export function ProductToolsSection() {
  return (
    <Box className="controlSection" sx={{ p: 1.2 }}>
      <Typography variant="body2" sx={{ fontWeight: 900, mb: 0.8 }}>Tools</Typography>
      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
        {tools.map(([label, href]) => (
          <Button key={href} component={Link} href={href} size="small" variant="outlined">
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
