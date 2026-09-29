'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  downloadText,
  productApiRequest,
  splitList,
  type ProductFeature,
  type ProductToolMode
} from './productToolsApi';

const toolNav: Array<{ mode: ProductToolMode; label: string; href: string }> = [
  { mode: 'library', label: 'Library', href: '/library' },
  { mode: 'history', label: 'History', href: '/history' },
  { mode: 'sources', label: 'Sources', href: '/sources' },
  { mode: 'collections', label: 'Collections', href: '/collections' },
  { mode: 'rules', label: 'Rules', href: '/rules' },
  { mode: 'schedules', label: 'Schedules', href: '/schedules' },
  { mode: 'digests', label: 'Digests', href: '/digests' },
  { mode: 'import-export', label: 'Import / Export', href: '/import-export' }
];

function endpointForMode(mode: ProductToolMode) {
  if (mode === 'library') return '/api/library';
  if (mode === 'collections') return '/api/collections';
  if (mode === 'rules') return '/api/rules';
  if (mode === 'schedules') return '/api/schedules';
  if (mode === 'digests') return '/api/digests';
  return '';
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.78rem', color: 'text.secondary' }}>
      {JSON.stringify(value, null, 2)}
    </Box>
  );
}

export function ProductToolPage({ mode }: { mode: ProductToolMode }) {
  const nav = useMemo(() => toolNav, []);
  const [items, setItems] = useState<ProductFeature[]>([]);
  const [auxItems, setAuxItems] = useState<any[]>([]);
  const [message, setMessage] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [webhook, setWebhook] = useState('');
  const [opml, setOpml] = useState('');
  const [maintenanceFeedUrl, setMaintenanceFeedUrl] = useState('');
  const [maintenanceLimit, setMaintenanceLimit] = useState('80');

  const titleLabel = {
    library: 'Saved Stories',
    history: 'Feed And Delivery History',
    sources: 'Source Profiles',
    collections: 'Collections And Workspaces',
    rules: 'Alert Rules',
    schedules: 'Scheduled Briefings',
    digests: 'Digest Builder',
    'import-export': 'Import / Export'
  }[mode];

  const load = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'history') {
        const result = await productApiRequest<{ items: any[]; fetched: any[] }>('/api/history?limit=120');
        setAuxItems([...(result.items || []), ...(result.fetched || [])]);
        setItems([]);
      } else if (mode === 'sources') {
        const result = await productApiRequest<{ items: any[] }>('/api/sources');
        setAuxItems(result.items || []);
        setItems([]);
      } else if (mode !== 'import-export') {
        const result = await productApiRequest<{ items: ProductFeature[] }>(`${endpointForMode(mode)}?limit=120`);
        setItems(result.items || []);
        setAuxItems([]);
      }
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }, [mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const createItem = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'library') {
        await productApiRequest('/api/library', {
          body: {
            title: title || 'Saved story',
            itemId: `manual-${Date.now()}`,
            feedUrl: 'manual',
            link: text,
            tags: splitList(tags)
          }
        });
      } else if (mode === 'rules') {
        await productApiRequest('/api/rules', {
          body: {
            name: title || 'Alert rule',
            keywords: splitList(text),
            discordWebhookUrl: webhook
          }
        });
      } else if (mode === 'collections') {
        await productApiRequest('/api/collections', {
          body: {
            name: title || 'Collection',
            description: text,
            feedUrls: splitList(tags),
            storyIds: [],
            tags: []
          }
        });
      } else if (mode === 'schedules') {
        await productApiRequest('/api/schedules', {
          body: {
            name: title || 'Scheduled briefing',
            cadence: text === 'hourly' || text === 'weekly' ? text : 'daily',
            discordWebhookUrl: webhook
          }
        });
      } else if (mode === 'digests') {
        await productApiRequest('/api/digests', {
          body: {
            title: title || 'Digest',
            body: text,
            storyIds: [],
            feedUrls: [],
            discordWebhookUrl: webhook
          }
        });
      }
      setTitle('');
      setText('');
      setTags('');
      setWebhook('');
      // Reload first: load() clears the message, which would wipe this confirmation.
      await load();
      setMessage({ kind: 'success', text: 'Saved.' });
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const archiveItem = async (item: ProductFeature) => {
    setBusy(true);
    try {
      await productApiRequest(`${endpointForMode(mode)}/${item.id}`, { method: 'DELETE' });
      await load();
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const runItem = async (item: ProductFeature) => {
    setBusy(true);
    try {
      const path = mode === 'rules' ? `/api/rules/${item.id}/run` : `/api/schedules/${item.id}/run`;
      await productApiRequest(path, { method: 'POST' });
      // Reload first: load() clears the message, which would wipe this confirmation.
      await load();
      setMessage({ kind: 'success', text: 'Run completed.' });
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const shareDigest = async (item: ProductFeature) => {
    setBusy(true);
    try {
      const result = await productApiRequest<{ url: string }>('/api/share', {
        body: {
          kind: mode === 'library' ? 'story' : mode === 'digests' ? 'digest' : 'collection',
          title: item.title,
          payload: item.payload
        }
      });
      setMessage({ kind: 'success', text: `Share link: ${result.url}` });
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const previewOpml = async () => {
    setBusy(true);
    try {
      const result = await productApiRequest<{ feeds: any[] }>('/api/opml/import-preview', { body: { opml } });
      setAuxItems(result.feeds || []);
      setMessage({ kind: 'success', text: `Found ${(result.feeds || []).length} feeds.` });
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const importOpml = async () => {
    setBusy(true);
    try {
      const result = await productApiRequest<{ feeds: any[]; added: number }>('/api/opml/import', { body: { opml } });
      setAuxItems(result.feeds || []);
      setMessage({ kind: 'success', text: `Imported ${result.added || 0} new feeds.` });
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const exportOpml = async () => {
    const content = await productApiRequest<string>('/api/opml/export', { accept: 'text' });
    downloadText('ai-news-feeds.opml', content, 'text/xml;charset=utf-8');
  };

  const exportUsage = async (format: 'json' | 'csv') => {
    if (format === 'csv') {
      const content = await productApiRequest<string>('/api/ai-usage/export?format=csv', { accept: 'text' });
      downloadText('ai-usage.csv', content, 'text/csv;charset=utf-8');
      return;
    }
    const result = await productApiRequest('/api/ai-usage/export');
    downloadText('ai-usage.json', JSON.stringify(result, null, 2), 'application/json;charset=utf-8');
  };

  const resetUsage = async () => {
    await productApiRequest('/api/ai-usage/reset', { method: 'POST' });
    setMessage({ kind: 'success', text: 'AI usage reset.' });
  };

  const runMaintenance = async (kind: 'summary' | 'translation' | 'research' | 'all', missingOnly = false) => {
    setBusy(true);
    try {
      const result = await productApiRequest<{ queued: Record<string, number>; selected: number }>('/api/maintenance/regenerate', {
        body: {
          kind,
          feedUrl: maintenanceFeedUrl.trim() || undefined,
          limit: Number(maintenanceLimit) || 80,
          missingOnly
        }
      });
      const queued = result.queued || {};
      setMessage({
        kind: 'success',
        text: `Queued summary=${queued.summary || 0}, translation=${queued.translation || 0}, research=${queued.research || 0} across ${result.selected || 0} selected stories.`
      });
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={2.2}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={1}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{titleLabel}</Typography>
            <Typography variant="body2" color="text.secondary">Secondary tools. The live news columns stay unchanged.</Typography>
          </Box>
          <Button component={Link} href="/" variant="outlined">Back to news</Button>
        </Stack>

        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
          {nav.map(item => (
            <Button key={item.mode} component={Link} href={item.href} size="small" variant={item.mode === mode ? 'contained' : 'outlined'}>
              {item.label}
            </Button>
          ))}
        </Stack>

        {message ? <Alert severity={message.kind}>{message.text}</Alert> : null}

        {mode === 'import-export' ? (
          <Stack spacing={1.4}>
            <Box sx={{ border: '1px solid var(--panel-border)', borderRadius: 2, p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>OPML</Typography>
              <TextField multiline minRows={6} fullWidth label="Paste OPML" value={opml} onChange={event => setOpml(event.target.value)} />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button variant="contained" onClick={previewOpml} disabled={busy || !opml.trim()}>Preview import</Button>
                <Button variant="contained" color="secondary" onClick={importOpml} disabled={busy || !opml.trim()}>Import feeds</Button>
                <Button variant="outlined" onClick={() => void exportOpml()} disabled={busy}>Export feeds</Button>
              </Stack>
            </Box>
            <Box sx={{ border: '1px solid var(--panel-border)', borderRadius: 2, p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>AI Usage</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button variant="outlined" onClick={() => void exportUsage('json')}>Export JSON</Button>
                <Button variant="outlined" onClick={() => void exportUsage('csv')}>Export CSV</Button>
                <Button color="warning" variant="outlined" onClick={() => void resetUsage()}>Reset usage</Button>
              </Stack>
            </Box>
            <Box sx={{ border: '1px solid var(--panel-border)', borderRadius: 2, p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Regenerate AI Outputs</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1 }}>
                <TextField size="small" label="Feed URL (optional)" value={maintenanceFeedUrl} onChange={event => setMaintenanceFeedUrl(event.target.value)} fullWidth />
                <TextField size="small" label="Limit" value={maintenanceLimit} onChange={event => setMaintenanceLimit(event.target.value)} sx={{ maxWidth: { md: 140 } }} />
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button variant="outlined" onClick={() => void runMaintenance('summary')} disabled={busy}>Regenerate summaries</Button>
                <Button variant="outlined" onClick={() => void runMaintenance('translation')} disabled={busy}>Regenerate translations</Button>
                <Button variant="outlined" onClick={() => void runMaintenance('research')} disabled={busy}>Regenerate research</Button>
                <Button variant="contained" onClick={() => void runMaintenance('all')} disabled={busy}>Regenerate all</Button>
                <Button variant="outlined" color="secondary" onClick={() => void runMaintenance('all', true)} disabled={busy}>Fill missing only</Button>
              </Stack>
            </Box>
          </Stack>
        ) : null}

        {['library', 'collections', 'rules', 'schedules', 'digests'].includes(mode) ? (
          <Box sx={{ border: '1px solid var(--panel-border)', borderRadius: 2, p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Create</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField size="small" label="Title / name" value={title} onChange={event => setTitle(event.target.value)} fullWidth />
              <TextField size="small" label={mode === 'rules' ? 'Keywords' : mode === 'schedules' ? 'Cadence: daily/hourly/weekly' : mode === 'library' ? 'Story URL' : mode === 'collections' ? 'Description' : 'Digest body'} value={text} onChange={event => setText(event.target.value)} fullWidth />
              {mode === 'library' || mode === 'collections' ? <TextField size="small" label={mode === 'collections' ? 'Feed URLs' : 'Tags'} value={tags} onChange={event => setTags(event.target.value)} fullWidth /> : null}
              {mode === 'rules' || mode === 'schedules' || mode === 'digests' ? <TextField size="small" label="Discord webhook" value={webhook} onChange={event => setWebhook(event.target.value)} fullWidth /> : null}
              <Button variant="contained" onClick={() => void createItem()} disabled={busy}>Save</Button>
            </Stack>
          </Box>
        ) : null}

        <Box sx={{ border: '1px solid var(--panel-border)', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Items</Typography>
            <Button size="small" onClick={() => void load()} disabled={busy}>Refresh</Button>
          </Box>
          <Divider />
          <Stack spacing={0} divider={<Divider />}>
            {(mode === 'history' || mode === 'sources' || mode === 'import-export' ? auxItems : items).map((item: any, index: number) => (
              <Box key={item.id || item.url || item.xmlUrl || index} sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }}>{item.title || item.label || item.name || item.xmlUrl || item.stage || 'Item'}</Typography>
                    <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap" sx={{ mt: 0.6 }}>
                      {item.kind ? <Chip size="small" label={item.kind} /> : null}
                      {item.status ? <Chip size="small" color={item.status === 'failed' ? 'error' : 'primary'} label={item.status} /> : null}
                      {item.stage ? <Chip size="small" variant="outlined" label={item.stage} /> : null}
                      {item.recentCount ? <Chip size="small" variant="outlined" label={`${item.recentCount} recent`} /> : null}
                    </Stack>
                    <Box sx={{ mt: 1 }}>
                      <JsonPreview value={item.payload || item.details || item} />
                    </Box>
                  </Box>
                  {'payload' in item ? (
                    <Stack direction="row" spacing={0.8} sx={{ flexShrink: 0 }}>
                      {mode === 'rules' || mode === 'schedules' ? <Button size="small" variant="outlined" onClick={() => void runItem(item)}>Run</Button> : null}
                      {mode === 'library' || mode === 'collections' || mode === 'digests' ? <Button size="small" variant="outlined" onClick={() => void shareDigest(item)}>Share</Button> : null}
                      <Button size="small" color="warning" variant="outlined" onClick={() => void archiveItem(item)}>Archive</Button>
                    </Stack>
                  ) : null}
                </Stack>
              </Box>
            ))}
            {!busy && !(mode === 'history' || mode === 'sources' || mode === 'import-export' ? auxItems : items).length ? (
              <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">No items yet.</Typography>
              </Box>
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
