import dynamic from 'next/dynamic';

const MarketingLanding = dynamic(() => import('../components/MarketingLanding'), {
  ssr: false,
});

export default function HomePage() {
  return <MarketingLanding />;
}
