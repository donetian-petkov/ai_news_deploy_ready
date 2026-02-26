import Script from 'next/script';
import TopMenu from './components/TopMenu';
import NewsRuntimeShell from './components/NewsRuntimeShell';

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export default function Page() {
  return (
    <>
      <Script id="ai-news-ws-url" strategy="beforeInteractive">
        {`window.__AI_NEWS_WS_URL = ${JSON.stringify(wsUrl)};`}
      </Script>
      <TopMenu />
      <NewsRuntimeShell />
      <Script src="/legacy/app.js" strategy="afterInteractive" />
    </>
  );
}
