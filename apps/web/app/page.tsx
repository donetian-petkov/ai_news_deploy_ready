import TopMenu from './components/TopMenu';
import ReactColumnsPreview from './components/ReactColumnsPreview';

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export default function Page() {
  return (
    <>
      <TopMenu />
      <ReactColumnsPreview wsUrl={wsUrl} />
    </>
  );
}
