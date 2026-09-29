import { PublicSharePage } from '../../components/product-tools/PublicSharePage';

export default function SharePage({ params }: { params: { token: string } }) {
  return <PublicSharePage token={params.token} />;
}
