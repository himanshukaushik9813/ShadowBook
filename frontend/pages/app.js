import dynamic from 'next/dynamic';

const DappScreen = dynamic(() => import('../components/DappScreen'), {
  ssr: false,
});

export default function AppPage() {
  return <DappScreen />;
}
