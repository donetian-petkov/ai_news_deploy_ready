#!/usr/bin/env node

// Records short interaction clips for the README and converts them to GIFs (needs ffmpeg on PATH).
// Expects the API and web app to be running, like capture-readme-screenshots.js.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium, devices } = require('playwright');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'docs', 'recordings');
const envPath = path.join(repoRoot, '.env');
const baseUrl = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:3000';
const apiBaseUrl = process.env.CAPTURE_API_BASE_URL || 'http://127.0.0.1:4000';
const authTokenStorageKey = 'ai_news_auth_token';
const uiPrefsStorageKey = 'aiNews.uiPrefs.v3';
const desktopViewport = { width: 1440, height: 900 };

const baseUiPrefs = {
  language: 'en',
  aiProvider: 'openai',
  colorMode: 'dark',
  menuCollapsed: true,
  controlsCollapsed: false,
  searchVisible: false,
  addStreamVisible: false,
  allColumnControlsHidden: false,
  buttonMode: 'icons',
  font: 'system',
  fontSize: 'md',
  scheme: 'classic',
  timezone: 'system',
  dateFormat: 'ddmmyy',
  showNewsCovers: true,
  performanceMode: false,
  menuHintMode: 'buttons',
  effectIntensity: 'medium',
  soundEnabled: false,
  soundTheme: 'vibe',
  vibe: 'arcade'
};

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseDotEnvValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith('\'') && trimmed.endsWith('\''))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readRequiredOpenAiKey() {
  const envValue = parseDotEnvValue(process.env.OPENAI_API_KEY || '');
  if (envValue) return envValue;

  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^OPENAI_API_KEY\s*=\s*(.*)$/);
    if (!match) continue;
    const value = parseDotEnvValue(match[1]);
    if (value) return value;
  }
  throw new Error(`OPENAI_API_KEY is missing in ${envPath}`);
}

async function requestJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!response.ok) {
    const message = body && typeof body.error === 'string' ? body.error : `Request failed (${response.status})`;
    throw new Error(`${message} at ${url}`);
  }
  return body;
}

async function createCaptureSession() {
  const apiKey = readRequiredOpenAiKey();
  const username = `readmerecord${Date.now()}${Math.random().toString(36).slice(2, 7)}`.toLowerCase();
  const password = `record-${Math.random().toString(36).slice(2, 12)}`;
  const auth = await requestJson(`${apiBaseUrl}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  await requestJson(`${apiBaseUrl}/api/auth/provider-key`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ provider: 'openai', apiKey })
  });
  return { token: auth.token, username };
}

function seedScript({ token, authTokenStorageKey, uiPrefsStorageKey, prefs }) {
  if (!window.sessionStorage.getItem('readmeCaptureSeeded')) {
    window.sessionStorage.setItem('readmeCaptureSeeded', '1');
    window.localStorage.setItem(authTokenStorageKey, token);
    window.localStorage.setItem(uiPrefsStorageKey, JSON.stringify(prefs));
  }
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = 'nextjs-portal { display: none !important; }';
    document.head.appendChild(style);
    // The app briefly warns that sign-in is required while it confirms the saved login; keep that out of the clips.
    const hideLoginRace = () => {
      document.querySelectorAll('.MuiAlert-root').forEach(node => {
        if (/Sign in is required before starting/i.test(node.textContent || '')) node.style.display = 'none';
      });
    };
    new MutationObserver(hideLoginRace).observe(document.body, { childList: true, subtree: true });
    // Per-feed Discord webhook URLs are secrets; blur any field holding one so it never lands in a public GIF.
    window.setInterval(() => {
      document.querySelectorAll('input, textarea').forEach(node => {
        if (/webhooks?\//i.test(node.value || '')) node.style.filter = 'blur(6px)';
      });
    }, 100);
  });
}

async function waitForApp(page) {
  await page.getByRole('heading', { name: /Live News Stream|Поток Новини На Живо/i }).waitFor({ timeout: 60000 });
  await page.waitForSelector('.feed-column-shell', { timeout: 90000 });
  await page.waitForSelector('.news-item-card', { timeout: 90000 });
  await page.getByText(/Sign in to unlock live news/i).first().waitFor({ state: 'hidden', timeout: 60000 });
  await wait(2500);
}

// Opens a recorded page, waits for the app, runs the interaction, then converts only the interaction part to a GIF.
async function recordClip(browser, { name, contextOptions, prefs, token, width, run }) {
  const videoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'readme-rec-'));
  const context = await browser.newContext({
    colorScheme: 'dark',
    ...contextOptions,
    recordVideo: { dir: videoDir, size: contextOptions.viewport }
  });
  await context.addInitScript(seedScript, {
    token,
    authTokenStorageKey,
    uiPrefsStorageKey,
    prefs: { ...baseUiPrefs, ...prefs, persistedAtMs: Date.now() }
  });

  const page = await context.newPage();
  const videoStartedAt = Date.now();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForApp(page);

  const clipStart = (Date.now() - videoStartedAt) / 1000;
  await run(page);
  await wait(800);
  const clipEnd = (Date.now() - videoStartedAt) / 1000;

  const video = page.video();
  await context.close();
  const webmPath = await video.path();
  const gifPath = path.join(outputDir, `${name}.gif`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', clipStart.toFixed(2), '-t', (clipEnd - clipStart).toFixed(2),
    '-i', webmPath,
    '-vf', `fps=12,scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    gifPath
  ]);
  fs.rmSync(videoDir, { recursive: true, force: true });
  const sizeMb = (fs.statSync(gifPath).size / (1024 * 1024)).toFixed(1);
  console.log(`${name}.gif  ${(clipEnd - clipStart).toFixed(1)}s  ${sizeMb} MB`);
}

// Clicks use force: the animated vibe frames never count as "stable", so normal clicks stall for seconds.
async function pickVibe(page, label) {
  await page.locator('#quickVibeSelect').click({ force: true });
  await wait(700);
  await page.getByRole('menuitem', { name: label }).first().click({ force: true });
  await wait(2200);
}

async function pinnedCard(page) {
  // Match by button name, not visible text: in icon mode the card buttons show icons with tooltip labels.
  const card = page.locator('.news-item-card')
    .filter({ has: page.getByRole('button', { name: /Ask Agent/i }) })
    .filter({ has: page.getByRole('button', { name: /^Research$/i }) })
    .first();
  const newsId = await card.getAttribute('data-news-id');
  return newsId ? page.locator(`.news-item-card[data-news-id="${newsId.replace(/"/g, '\\"')}"]`).first() : card;
}

const desktopClips = [
  {
    name: 'vibe-switching',
    prefs: { vibe: 'arcade' },
    run: async page => {
      await wait(1200);
      for (const label of ['Sci-Fi', 'Fantasy', 'Cyber Witch', 'Anime', 'Video Game']) {
        await pickVibe(page, label);
      }
    }
  },
  {
    name: 'settings-menu',
    prefs: { vibe: 'scifi' },
    run: async page => {
      await wait(800);
      await page.locator('#menuToggle').click({ force: true });
      const overlay = page.locator('.desktopOverlayPaper');
      await overlay.waitFor({ state: 'visible', timeout: 15000 });
      await wait(1500);
      // The wheel does not reach the panel's inner scroller, so scroll whichever element inside it can scroll.
      for (let step = 0; step < 6; step += 1) {
        await overlay.evaluate(root => {
          const scroller = [root, ...root.querySelectorAll('*')]
            .find(node => node.scrollHeight > node.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(node).overflowY));
          (scroller || document.scrollingElement).scrollBy({ top: 380, behavior: 'smooth' });
        });
        await wait(900);
      }
      await wait(800);
      await page.getByRole('button', { name: /Close/i }).first().click({ force: true });
      await wait(1000);
    }
  },
  {
    name: 'news-card-ai-and-ask-agent',
    prefs: { vibe: 'cyberwitch' },
    run: async page => {
      const card = await pinnedCard(page);
      await card.evaluate(node => node.scrollIntoView({ block: 'start' }));
      await page.evaluate(() => window.scrollBy(0, -90));
      await wait(1200);
      const aiToggle = card.getByRole('button', { name: /Show AI analysis/i }).first();
      if (await aiToggle.count()) {
        await aiToggle.click({ force: true });
        await wait(1800);
      }
      const research = card.getByRole('button', { name: /^Research$/i }).first();
      if (await research.count()) {
        await research.click({ force: true });
        await wait(2500);
      }
      await card.getByRole('button', { name: /Ask Agent/i }).first().click({ force: true });
      await wait(1000);
      const input = card.getByPlaceholder(/Ask about this specific news/i).first();
      await input.evaluate(node => node.scrollIntoView({ block: 'center' }));
      await input.click({ force: true });
      await input.pressSequentially('Why does this matter?', { delay: 70 });
      await wait(600);
      await card.getByRole('button', { name: /^Send$/i }).first().click({ force: true });
      await wait(9000);
    }
  },
  {
    name: 'search',
    prefs: { vibe: 'fantasy' },
    run: async page => {
      await wait(1000);
      await page.keyboard.press('/');
      await wait(900);
      await page.keyboard.type('България', { delay: 140 });
      await wait(3500);
      await page.keyboard.press('Escape');
      await wait(800);
    }
  }
];

async function main() {
  await fs.promises.mkdir(outputDir, { recursive: true });
  const { token, username } = await createCaptureSession();
  const only = (process.env.CAPTURE_ONLY || '').split(',').map(value => value.trim()).filter(Boolean);
  const wanted = clip => !only.length || only.includes(clip.name);
  const browser = await chromium.launch({ headless: true });

  try {
    for (const clip of desktopClips.filter(wanted)) {
      await recordClip(browser, {
        ...clip,
        token,
        width: 960,
        contextOptions: { viewport: desktopViewport }
      });
    }

    const mobileClip = {
      name: 'mobile-column-controls',
      prefs: { vibe: 'cyberwitch' },
      run: async page => {
        await wait(1000);
        const column = page.locator('.feed-column-shell').first();
        await column.getByRole('button', { name: /Show controls/i }).first().click({ force: true });
        await wait(2200);
        await page.mouse.wheel(0, 500);
        await wait(1500);
        await page.mouse.wheel(0, -500);
        await wait(1000);
        await column.getByRole('button', { name: /Hide controls/i }).first().click({ force: true });
        await wait(1500);
      }
    };
    if (wanted(mobileClip)) {
      const { defaultBrowserType, ...iphone } = devices['iPhone 13'];
      await recordClip(browser, {
        ...mobileClip,
        token,
        width: 390,
        contextOptions: iphone
      });
    }
  } finally {
    await browser.close();
  }

  console.log(`Recordings saved in ${outputDir} (capture account: ${username})`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
