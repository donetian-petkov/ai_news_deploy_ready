import fs from 'node:fs';
import path from 'node:path';
import Script from 'next/script';
import TopMenu from './components/TopMenu';

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

function loadLegacyBodyWithoutTopbarHtml(): string {
  const htmlPath = path.join(process.cwd(), 'public', 'legacy', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyInner = (bodyMatch ? bodyMatch[1] : html)
    .replace(/<script\s+src="app\.js"><\/script>/gi, '')
    .trim();

  const topbarStart = bodyInner.indexOf('<div class="topbar">');
  const containerStart = bodyInner.indexOf('<div class="container">', topbarStart);
  if (topbarStart >= 0 && containerStart > topbarStart) {
    return `${bodyInner.slice(0, topbarStart)}${bodyInner.slice(containerStart)}`.trim();
  }

  return bodyInner;
}

const legacyBodyHtml = loadLegacyBodyWithoutTopbarHtml();

export default function Page() {
  return (
    <>
      <Script id="ai-news-ws-url" strategy="beforeInteractive">
        {`window.__AI_NEWS_WS_URL = ${JSON.stringify(wsUrl)};`}
      </Script>
      <TopMenu />
      <main suppressHydrationWarning dangerouslySetInnerHTML={{ __html: legacyBodyHtml }} />
      <Script src="/legacy/app.js" strategy="afterInteractive" />
    </>
  );
}
