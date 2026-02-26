import fs from 'node:fs';
import path from 'node:path';
import Script from 'next/script';

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

function loadLegacyBodyHtml(): string {
  const htmlPath = path.join(process.cwd(), 'public', 'legacy', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyInner = bodyMatch ? bodyMatch[1] : html;
  return bodyInner.replace(/<script\s+src="app\.js"><\/script>/gi, '').trim();
}

const legacyBodyHtml = loadLegacyBodyHtml();

export default function Page() {
  return (
    <>
      <Script id="ai-news-ws-url" strategy="beforeInteractive">
        {`window.__AI_NEWS_WS_URL = ${JSON.stringify(wsUrl)};`}
      </Script>
      <main suppressHydrationWarning dangerouslySetInnerHTML={{ __html: legacyBodyHtml }} />
      <Script src="/legacy/app.js" strategy="afterInteractive" />
    </>
  );
}
