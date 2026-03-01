import type { Metadata } from 'next';
import './globals.css';
import './styles/base.css';
import './styles/topbar-controls.css';
import './styles/vibe-ornaments.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'AI News Next + Node',
  description: 'Live AI news stream with Next.js frontend and Node backend',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
