import type express from 'express';
import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  alertRulePayloadSchema,
  digestPayloadSchema,
  opmlFeedSchema,
  savedStoryPayloadSchema,
  schedulePayloadSchema,
  shareKindSchema
} from '@ai-news/shared';

type AuthUser = { id: number; username: string };
type RequireAuthUser = (req: express.Request, res: express.Response) => Promise<AuthUser | null>;

type ProductFeed = {
  url: string;
  label: string;
  kind: string;
  intervalSec?: number;
  discordWebhookUrl?: string;
};

type ProductNews = {
  id: string;
  feedUrl: string;
  title: string;
  link?: string;
  source?: string;
  publishedMs?: number;
  summary?: string;
  research?: string;
  mood?: string;
  newsType?: string;
  isMatch?: boolean;
  filteredOk?: boolean;
};

type AiUsagePayload = {
  aiUsageInputTokens: number;
  aiUsageOutputTokens: number;
  aiUsageTotalTokens: number;
  aiUsageRuntimeStartedAt: number;
  aiUsageByKind: Record<string, { requests: number; inputTokens: number; outputTokens: number; totalTokens: number }>;
  aiUsageRecent: Array<Record<string, unknown>>;
};

export type ProductHistoryEntry = {
  userId?: number | null;
  feedUrl?: string;
  itemId?: string;
  title?: string;
  source?: string;
  stage: string;
  status: string;
  reason?: string;
  details?: Record<string, unknown>;
};

export type ProductFeatureRuntime = {
  recordHistory: (entry: ProductHistoryEntry) => Promise<void>;
  stop: () => void;
};

type RegisterProductFeatureApiArgs = {
  app: express.Express;
  prisma: PrismaClient;
  requireAuthUser: RequireAuthUser;
  getFeeds: () => ProductFeed[];
  getRecentNews: () => ProductNews[];
  getAiUsage: () => AiUsagePayload;
  resetAiUsage: () => AiUsagePayload;
  importFeeds?: (feeds: Array<{ title: string; xmlUrl: string; htmlUrl?: string }>) => number;
};

type FeatureKind = 'saved_story' | 'collection' | 'alert_rule' | 'schedule' | 'digest';

type FeatureRow = {
  id: number;
  userId: number;
  kind: FeatureKind;
  title: string;
  payloadJson: string;
  archived: number | boolean;
  createdAt: string;
  updatedAt: string;
};

const collectionPayloadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  feedUrls: z.array(z.string().trim().min(1)).max(100).default([]),
  storyIds: z.array(z.string().trim().min(1)).max(200).default([]),
  tags: z.array(z.string().trim().min(1).max(80)).max(40).default([])
});

const shareBodySchema = z.object({
  kind: shareKindSchema,
  title: z.string().trim().min(1).max(180),
  payload: z.record(z.unknown()).default({})
});

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function normalizeLimit(raw: unknown, fallback = 80, max = 500) {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(1, Math.min(max, Math.floor(value))) : fallback;
}

function safeTitle(raw: unknown, fallback: string) {
  const value = String(raw || '').replace(/\s+/g, ' ').trim();
  return value ? value.slice(0, 180) : fallback;
}

// Raw SQLite queries return BIGINT columns (for example publishedMs) as JS BigInt, which res.json cannot
// serialize; it throws and, from an async handler, takes the whole API process down.
function jsonSafeRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'bigint' ? Number(value) : value]));
}

function rowToFeature(row: FeatureRow) {
  return {
    id: Number(row.id),
    userId: Number(row.userId),
    kind: row.kind,
    title: row.title,
    payload: parseJsonObject(row.payloadJson),
    archived: !!row.archived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

async function ensureProductFeatureTables(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserFeatureRecord" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "userId" INTEGER NOT NULL,
      "kind" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "payloadJson" TEXT NOT NULL,
      "archived" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "UserFeatureRecord_userId_kind_updatedAt_idx" ON "UserFeatureRecord"("userId", "kind", "updatedAt")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "UserFeatureRecord_kind_updatedAt_idx" ON "UserFeatureRecord"("kind", "updatedAt")');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DeliveryHistoryRecord" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "userId" INTEGER,
      "feedUrl" TEXT,
      "itemId" TEXT,
      "title" TEXT,
      "source" TEXT,
      "stage" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "reason" TEXT,
      "detailsJson" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "DeliveryHistoryRecord_userId_createdAt_idx" ON "DeliveryHistoryRecord"("userId", "createdAt")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "DeliveryHistoryRecord_feedUrl_createdAt_idx" ON "DeliveryHistoryRecord"("feedUrl", "createdAt")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "DeliveryHistoryRecord_stage_status_createdAt_idx" ON "DeliveryHistoryRecord"("stage", "status", "createdAt")');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ShareLink" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "token" TEXT NOT NULL,
      "userId" INTEGER NOT NULL,
      "kind" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "payloadJson" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expiresAt" DATETIME
    )
  `);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "ShareLink_token_key" ON "ShareLink"("token")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ShareLink_userId_createdAt_idx" ON "ShareLink"("userId", "createdAt")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ShareLink_kind_createdAt_idx" ON "ShareLink"("kind", "createdAt")');
}

function normalizeFeaturePayload(kind: FeatureKind, rawPayload: unknown) {
  const source = parseJsonObject(rawPayload);
  if (kind === 'saved_story') {
    const payload = savedStoryPayloadSchema.parse(source);
    return { title: safeTitle(payload.title, 'Saved story'), payload };
  }
  if (kind === 'alert_rule') {
    const payload = alertRulePayloadSchema.parse(source);
    return { title: safeTitle(payload.name, 'Alert rule'), payload };
  }
  if (kind === 'schedule') {
    const payload = schedulePayloadSchema.parse(source);
    if (!payload.nextRunAtMs) payload.nextRunAtMs = computeNextRunAtMs(payload.cadence);
    return { title: safeTitle(payload.name, 'Scheduled briefing'), payload };
  }
  if (kind === 'digest') {
    const payload = digestPayloadSchema.parse(source);
    return { title: safeTitle((source.title as string | undefined) || 'Digest', 'Digest'), payload };
  }
  const payload = collectionPayloadSchema.parse(source);
  return { title: safeTitle(payload.name, 'Collection'), payload };
}

async function listFeatureRows(prisma: PrismaClient, userId: number, kind: FeatureKind, limit: number, includeArchived = false) {
  const archivedClause = includeArchived ? '' : 'AND "archived" = false';
  return prisma.$queryRawUnsafe<FeatureRow[]>(
    `SELECT * FROM "UserFeatureRecord" WHERE "userId" = ? AND "kind" = ? ${archivedClause} ORDER BY "updatedAt" DESC LIMIT ?`,
    userId,
    kind,
    limit
  );
}

async function findFeatureRow(prisma: PrismaClient, userId: number, id: number) {
  const rows = await prisma.$queryRawUnsafe<FeatureRow[]>(
    'SELECT * FROM "UserFeatureRecord" WHERE "userId" = ? AND "id" = ? LIMIT 1',
    userId,
    id
  );
  return rows[0] || null;
}

async function createFeatureRecord(prisma: PrismaClient, userId: number, kind: FeatureKind, title: string, payload: Record<string, unknown>) {
  await prisma.$executeRawUnsafe(
    'INSERT INTO "UserFeatureRecord" ("userId", "kind", "title", "payloadJson", "archived", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    userId,
    kind,
    title,
    JSON.stringify(payload)
  );
  const ids = await prisma.$queryRawUnsafe<Array<{ id: number }>>('SELECT last_insert_rowid() as id');
  return findFeatureRow(prisma, userId, Number(ids[0]?.id || 0));
}

async function updateFeatureRecord(prisma: PrismaClient, userId: number, id: number, title: string, payload: Record<string, unknown>, archived = false) {
  await prisma.$executeRawUnsafe(
    'UPDATE "UserFeatureRecord" SET "title" = ?, "payloadJson" = ?, "archived" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = ? AND "id" = ?',
    title,
    JSON.stringify(payload),
    archived ? 1 : 0,
    userId,
    id
  );
  return findFeatureRow(prisma, userId, id);
}

async function recordHistoryRaw(prisma: PrismaClient, entry: ProductHistoryEntry) {
  await ensureProductFeatureTables(prisma);
  await prisma.$executeRawUnsafe(
    'INSERT INTO "DeliveryHistoryRecord" ("userId", "feedUrl", "itemId", "title", "source", "stage", "status", "reason", "detailsJson", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    entry.userId ?? null,
    entry.feedUrl || null,
    entry.itemId || null,
    entry.title || null,
    entry.source || null,
    String(entry.stage || 'event').slice(0, 80),
    String(entry.status || 'ok').slice(0, 80),
    entry.reason || null,
    entry.details ? JSON.stringify(entry.details) : null
  );
}

function buildUsageExport(usage: AiUsagePayload) {
  const byKind = usage.aiUsageByKind || {};
  return {
    generatedAt: new Date().toISOString(),
    inputTokens: usage.aiUsageInputTokens,
    outputTokens: usage.aiUsageOutputTokens,
    totalTokens: usage.aiUsageTotalTokens,
    runtimeStartedAt: usage.aiUsageRuntimeStartedAt,
    byKind,
    recent: usage.aiUsageRecent || []
  };
}

function usageExportToCsv(usage: ReturnType<typeof buildUsageExport>) {
  const lines = ['kind,model,label,inputTokens,outputTokens,totalTokens,createdAt'];
  for (const entry of usage.recent) {
    const values = [
      entry.kind,
      entry.model,
      entry.label,
      entry.inputTokens,
      entry.outputTokens,
      entry.totalTokens,
      entry.createdAt
    ].map(value => `"${String(value ?? '').replace(/"/g, '""')}"`);
    lines.push(values.join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function parseOpmlFeeds(opmlRaw: string) {
  const opml = String(opmlRaw || '');
  const feeds: Array<z.infer<typeof opmlFeedSchema>> = [];
  const seen = new Set<string>();
  const outlineRe = /<outline\b[^>]*>/gi;
  const attrRe = /(\w+)=(?:"([^"]*)"|'([^']*)')/g;
  for (const outline of opml.match(outlineRe) || []) {
    const attrs: Record<string, string> = {};
    let attr: RegExpExecArray | null;
    while ((attr = attrRe.exec(outline))) {
      attrs[attr[1]] = decodeXmlEntities(attr[2] || attr[3] || '');
    }
    const xmlUrl = attrs.xmlUrl || attrs.xmlurl || attrs.url || '';
    if (!xmlUrl || seen.has(xmlUrl)) continue;
    const parsed = opmlFeedSchema.safeParse({
      title: attrs.title || attrs.text || new URL(xmlUrl).hostname,
      xmlUrl,
      htmlUrl: attrs.htmlUrl || attrs.htmlurl || undefined
    });
    if (!parsed.success) continue;
    seen.add(xmlUrl);
    feeds.push(parsed.data);
  }
  return feeds;
}

export function buildOpml(feeds: ProductFeed[]) {
  const outlines = feeds
    .filter(feed => feed.url && feed.url !== '__filtered__')
    .map(feed => `    <outline text="${escapeXml(feed.label || feed.url)}" title="${escapeXml(feed.label || feed.url)}" type="rss" xmlUrl="${escapeXml(feed.url)}" />`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head><title>AI News feeds</title></head>\n  <body>\n${outlines}\n  </body>\n</opml>\n`;
}

function escapeXml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function decodeXmlEntities(value: string) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function computeNextRunAtMs(cadence: string, fromMs = Date.now()) {
  const hour = cadence === 'hourly' ? 60 * 60 * 1000 : cadence === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return fromMs + hour;
}

function newsMatchesRule(item: ProductNews, payload: z.infer<typeof alertRulePayloadSchema>) {
  const haystack = `${item.title || ''} ${item.summary || ''} ${item.research || ''}`.toLowerCase();
  const keywordOk = !payload.keywords.length || payload.keywords.some((keyword: string) => haystack.includes(keyword.toLowerCase()));
  const sourceOk = !payload.sources.length || payload.sources.some((source: string) => String(item.source || '').toLowerCase().includes(source.toLowerCase()));
  const moodOk = !payload.moods.length || payload.moods.includes(String(item.mood || ''));
  const typeOk = !payload.newsTypes.length || payload.newsTypes.includes(String(item.newsType || ''));
  return keywordOk && sourceOk && moodOk && typeOk;
}

async function postDiscordMessage(webhookUrl: string, title: string, body: string) {
  const url = String(webhookUrl || '').trim();
  if (!url || !/^https:\/\/(?:[^/]+\.)?(?:discord|discordapp)\.com\/api\/webhooks\//i.test(url)) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'AI News',
        embeds: [{
          title: title.slice(0, 240),
          description: body.slice(0, 3900),
          color: 0x3b82f6,
          timestamp: new Date().toISOString()
        }],
        allowed_mentions: { parse: [] }
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function runSchedule(prisma: PrismaClient, row: FeatureRow, getRecentNews: () => ProductNews[]) {
  const payload = schedulePayloadSchema.parse(parseJsonObject(row.payloadJson));
  const selected = payload.feedUrls.length ? new Set(payload.feedUrls) : null;
  const items = getRecentNews()
    .filter(item => !selected || selected.has(item.feedUrl))
    .sort((a, b) => Number(b.publishedMs || 0) - Number(a.publishedMs || 0))
    .slice(0, 12);
  const lines = items.map((item, index) => `${index + 1}. ${item.title}${item.source ? ` (${item.source})` : ''}`).join('\n');
  const body = lines || 'No recent stories matched this schedule yet.';
  const digestPayload = digestPayloadSchema.parse({
    storyIds: items.map(item => item.id),
    feedUrls: payload.feedUrls,
    body,
    format: payload.format,
    discordWebhookUrl: payload.discordWebhookUrl
  });
  await createFeatureRecord(prisma, row.userId, 'digest', `${payload.name} · ${new Date().toLocaleDateString()}`, digestPayload);
  let discordStatus = 'skipped';
  if (payload.discordWebhookUrl) {
    discordStatus = await postDiscordMessage(payload.discordWebhookUrl, payload.name, body) ? 'sent' : 'failed';
  }
  await recordHistoryRaw(prisma, {
    userId: row.userId,
    stage: 'scheduled_briefing',
    status: discordStatus === 'failed' ? 'failed' : 'generated',
    reason: discordStatus === 'skipped' ? 'No Discord webhook configured.' : undefined,
    details: { scheduleId: row.id, itemCount: items.length, discordStatus }
  });
  payload.lastRunAtMs = Date.now();
  payload.nextRunAtMs = computeNextRunAtMs(payload.cadence);
  await updateFeatureRecord(prisma, row.userId, row.id, row.title, payload);
}

async function runAlertRule(prisma: PrismaClient, row: FeatureRow, getRecentNews: () => ProductNews[]) {
  const payload = alertRulePayloadSchema.parse(parseJsonObject(row.payloadJson));
  if (!payload.enabled) return;
  const since = Number(payload.lastCheckedAtMs || 0);
  const matches = getRecentNews()
    .filter(item => Number(item.publishedMs || 0) > since)
    .filter(item => newsMatchesRule(item, payload))
    .slice(0, 20);
  for (const item of matches) {
    const body = `${item.title}\n${item.link || ''}`.trim();
    let discordStatus = 'skipped';
    if (payload.discordWebhookUrl) {
      discordStatus = await postDiscordMessage(payload.discordWebhookUrl, payload.name, body) ? 'sent' : 'failed';
    }
    await recordHistoryRaw(prisma, {
      userId: row.userId,
      feedUrl: item.feedUrl,
      itemId: item.id,
      title: item.title,
      source: item.source,
      stage: 'alert_rule',
      status: discordStatus === 'failed' ? 'failed' : 'matched',
      reason: discordStatus === 'skipped' ? 'No Discord webhook configured.' : undefined,
      details: { ruleId: row.id, discordStatus }
    });
  }
  payload.lastCheckedAtMs = Date.now();
  await updateFeatureRecord(prisma, row.userId, row.id, row.title, payload);
}

async function runDueAutomation(prisma: PrismaClient, getRecentNews: () => ProductNews[]) {
  await ensureProductFeatureTables(prisma);
  const now = Date.now();
  const schedules = await prisma.$queryRawUnsafe<FeatureRow[]>(
    'SELECT * FROM "UserFeatureRecord" WHERE "kind" = ? AND "archived" = false ORDER BY "updatedAt" DESC LIMIT 200',
    'schedule'
  );
  for (const row of schedules) {
    const payload = schedulePayloadSchema.safeParse(parseJsonObject(row.payloadJson));
    if (!payload.success || !payload.data.enabled) continue;
    if (!payload.data.nextRunAtMs || payload.data.nextRunAtMs <= now) {
      await runSchedule(prisma, row, getRecentNews).catch(() => {});
    }
  }
  const rules = await prisma.$queryRawUnsafe<FeatureRow[]>(
    'SELECT * FROM "UserFeatureRecord" WHERE "kind" = ? AND "archived" = false ORDER BY "updatedAt" DESC LIMIT 200',
    'alert_rule'
  );
  for (const row of rules) {
    await runAlertRule(prisma, row, getRecentNews).catch(() => {});
  }
}

export function registerProductFeatureApi({
  app,
  prisma,
  requireAuthUser,
  getFeeds,
  getRecentNews,
  getAiUsage,
  resetAiUsage,
  importFeeds
}: RegisterProductFeatureApiArgs): ProductFeatureRuntime {
  // Express 4 does not catch errors thrown by async handlers, and an unhandled rejection exits Node.
  // Turn them into responses instead: bad input (zod) is a 400, anything else a 500.
  type Handler = (req: express.Request, res: express.Response) => unknown;
  const guard = (handler: Handler): express.RequestHandler => (req, res) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch(error => {
        if (res.headersSent) return;
        if (error instanceof z.ZodError) {
          res.status(400).json({ error: 'Invalid request.', issues: error.issues.map(issue => `${issue.path.join('.') || 'body'}: ${issue.message}`) });
          return;
        }
        console.error(`[product-features] ${req.method} ${req.path} failed:`, error);
        res.status(500).json({ error: 'Request failed.' });
      });
  };
  const route = {
    get: (path: string, handler: Handler) => app.get(path, guard(handler)),
    post: (path: string, handler: Handler) => app.post(path, guard(handler)),
    put: (path: string, handler: Handler) => app.put(path, guard(handler)),
    delete: (path: string, handler: Handler) => app.delete(path, guard(handler))
  };

  void ensureProductFeatureTables(prisma).catch(err => {
    console.warn('[product-features] failed to ensure tables:', (err as Error).message);
  });

  const registerCrud = (basePath: string, kind: FeatureKind) => {
    route.get(basePath, async (req, res) => {
      const user = await requireAuthUser(req, res);
      if (!user) return;
      await ensureProductFeatureTables(prisma);
      const rows = await listFeatureRows(prisma, user.id, kind, normalizeLimit(req.query.limit), String(req.query.archived || '') === 'true');
      res.json({ ok: true, items: rows.map(rowToFeature) });
    });

    route.post(basePath, async (req, res) => {
      const user = await requireAuthUser(req, res);
      if (!user) return;
      await ensureProductFeatureTables(prisma);
      const { title, payload } = normalizeFeaturePayload(kind, (req.body as { payload?: unknown } | undefined)?.payload || req.body);
      const row = await createFeatureRecord(prisma, user.id, kind, title, payload);
      res.status(201).json({ ok: true, item: row ? rowToFeature(row) : null });
    });

    route.put(`${basePath}/:id`, async (req, res) => {
      const user = await requireAuthUser(req, res);
      if (!user) return;
      await ensureProductFeatureTables(prisma);
      const id = Number(req.params.id);
      const existing = Number.isFinite(id) ? await findFeatureRow(prisma, user.id, id) : null;
      if (!existing || existing.kind !== kind) {
        res.status(404).json({ error: 'Item not found.' });
        return;
      }
      const mergedPayload = {
        ...parseJsonObject(existing.payloadJson),
        ...parseJsonObject((req.body as { payload?: unknown } | undefined)?.payload || req.body)
      };
      const { title, payload } = normalizeFeaturePayload(kind, mergedPayload);
      const row = await updateFeatureRecord(prisma, user.id, id, title, payload, !!(req.body as { archived?: boolean } | undefined)?.archived);
      res.json({ ok: true, item: row ? rowToFeature(row) : null });
    });

    route.delete(`${basePath}/:id`, async (req, res) => {
      const user = await requireAuthUser(req, res);
      if (!user) return;
      await ensureProductFeatureTables(prisma);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'Invalid item id.' });
        return;
      }
      await prisma.$executeRawUnsafe(
        'UPDATE "UserFeatureRecord" SET "archived" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = ? AND "id" = ?',
        user.id,
        id
      );
      res.json({ ok: true });
    });
  };

  registerCrud('/api/library', 'saved_story');
  registerCrud('/api/collections', 'collection');
  registerCrud('/api/rules', 'alert_rule');
  registerCrud('/api/schedules', 'schedule');
  registerCrud('/api/digests', 'digest');

  route.post('/api/schedules/:id/run', async (req, res) => {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const row = await findFeatureRow(prisma, user.id, Number(req.params.id));
    if (!row || row.kind !== 'schedule') {
      res.status(404).json({ error: 'Schedule not found.' });
      return;
    }
    await runSchedule(prisma, row, getRecentNews);
    res.json({ ok: true });
  });

  route.post('/api/rules/:id/run', async (req, res) => {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const row = await findFeatureRow(prisma, user.id, Number(req.params.id));
    if (!row || row.kind !== 'alert_rule') {
      res.status(404).json({ error: 'Rule not found.' });
      return;
    }
    await runAlertRule(prisma, row, getRecentNews);
    res.json({ ok: true });
  });

  route.get('/api/history', async (req, res) => {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    await ensureProductFeatureTables(prisma);
    const limit = normalizeLimit(req.query.limit, 120, 500);
    const feedUrl = String(req.query.feedUrl || '').trim();
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      feedUrl
        ? 'SELECT * FROM "DeliveryHistoryRecord" WHERE ("userId" = ? OR "userId" IS NULL) AND "feedUrl" = ? ORDER BY "createdAt" DESC LIMIT ?'
        : 'SELECT * FROM "DeliveryHistoryRecord" WHERE "userId" = ? OR "userId" IS NULL ORDER BY "createdAt" DESC LIMIT ?',
      ...(feedUrl ? [user.id, feedUrl, limit] : [user.id, limit])
    );
    const newsRows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      feedUrl
        ? 'SELECT "feedUrl", "itemId", "title", "source", "publishedMs", "createdAt" FROM "NewsItemRecord" WHERE "feedUrl" = ? ORDER BY "publishedMs" DESC LIMIT ?'
        : 'SELECT "feedUrl", "itemId", "title", "source", "publishedMs", "createdAt" FROM "NewsItemRecord" ORDER BY "publishedMs" DESC LIMIT ?',
      ...(feedUrl ? [feedUrl, Math.min(limit, 120)] : [Math.min(limit, 120)])
    ).catch(() => []);
    res.json({
      ok: true,
      items: rows.map(row => ({ ...jsonSafeRow(row), details: parseJsonObject(row.detailsJson) })),
      fetched: newsRows.map(row => ({ ...jsonSafeRow(row), stage: 'feed_fetch', status: 'fetched' }))
    });
  });

  route.get('/api/sources', async (req, res) => {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const feeds = getFeeds();
    const news = getRecentNews();
    const items = feeds.map(feed => {
      const feedNews = news.filter(item => item.feedUrl === feed.url);
      const moods = new Map<string, number>();
      const types = new Map<string, number>();
      for (const item of feedNews) {
        if (item.mood) moods.set(item.mood, (moods.get(item.mood) || 0) + 1);
        if (item.newsType) types.set(item.newsType, (types.get(item.newsType) || 0) + 1);
      }
      return {
        ...feed,
        recentCount: feedNews.length,
        latest: feedNews[0] || null,
        moods: Object.fromEntries(moods),
        newsTypes: Object.fromEntries(types),
        discordEnabled: !!feed.discordWebhookUrl
      };
    });
    res.json({ ok: true, items });
  });

  route.get('/api/ai-usage/export', async (req, res) => {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const usage = buildUsageExport(getAiUsage());
    if (String(req.query.format || '').toLowerCase() === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="ai-usage.csv"');
      res.send(usageExportToCsv(usage));
      return;
    }
    res.json({ ok: true, usage });
  });

  route.post('/api/ai-usage/reset', async (req, res) => {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const usage = resetAiUsage();
    await recordHistoryRaw(prisma, {
      userId: user.id,
      stage: 'ai_usage',
      status: 'reset',
      reason: 'Usage counters reset by user.'
    });
    res.json({ ok: true, usage: buildUsageExport(usage) });
  });

  route.post('/api/opml/import-preview', async (req, res) => {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const feeds = parseOpmlFeeds(String((req.body as { opml?: unknown } | undefined)?.opml || ''));
    res.json({ ok: true, feeds });
  });

  route.post('/api/opml/import', async (req, res) => {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const feeds = parseOpmlFeeds(String((req.body as { opml?: unknown } | undefined)?.opml || ''));
    const added = importFeeds ? importFeeds(feeds) : 0;
    await recordHistoryRaw(prisma, {
      userId: user.id,
      stage: 'opml_import',
      status: added > 0 ? 'imported' : 'skipped',
      reason: added > 0 ? undefined : 'No new feeds to add.',
      details: { added, parsed: feeds.length }
    });
    res.json({ ok: true, feeds, added });
  });

  route.get('/api/opml/export', async (req, res) => {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    const opml = buildOpml(getFeeds());
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ai-news-feeds.opml"');
    res.send(opml);
  });

  route.post('/api/share', async (req, res) => {
    const user = await requireAuthUser(req, res);
    if (!user) return;
    await ensureProductFeatureTables(prisma);
    const parsed = shareBodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid share payload.' });
      return;
    }
    const token = crypto.randomBytes(18).toString('base64url');
    await prisma.$executeRawUnsafe(
      'INSERT INTO "ShareLink" ("token", "userId", "kind", "title", "payloadJson", "createdAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      token,
      user.id,
      parsed.data.kind,
      parsed.data.title,
      JSON.stringify(parsed.data.payload)
    );
    res.status(201).json({ ok: true, token, url: `/share/${token}` });
  });

  route.get('/api/share/:token', async (req, res) => {
    await ensureProductFeatureTables(prisma);
    const token = String(req.params.token || '').trim();
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      'SELECT "token", "kind", "title", "payloadJson", "createdAt", "expiresAt" FROM "ShareLink" WHERE "token" = ? LIMIT 1',
      token
    );
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Share link not found.' });
      return;
    }
    res.json({
      ok: true,
      item: {
        token: row.token,
        kind: row.kind,
        title: row.title,
        payload: parseJsonObject(row.payloadJson),
        createdAt: row.createdAt,
        expiresAt: row.expiresAt || null
      }
    });
  });

  const timer = setInterval(() => {
    void runDueAutomation(prisma, getRecentNews).catch(() => {});
  }, 60_000);

  return {
    recordHistory: entry => recordHistoryRaw(prisma, entry).catch(() => {}),
    stop: () => clearInterval(timer)
  };
}
