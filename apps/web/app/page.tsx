const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export default function Page() {
  const src = `/legacy/index.html?ws=${encodeURIComponent(wsUrl)}`;

  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <iframe
        title="AI News Legacy UI"
        src={src}
        style={{ width: '100%', height: '100%', border: '0', display: 'block' }}
      />
    </main>
  );
}
