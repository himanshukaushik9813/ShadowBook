import '@cofhe/react/styles.css';
import '../styles/tailwind.css';

import { useRouter } from 'next/router';
import AppProviders from '../components/AppProviders';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isWorkspaceRoute = router.pathname.startsWith('/app');

  if (!isWorkspaceRoute) {
    return <Component {...pageProps} />;
  }

  return (
    <AppProviders>
      <Component {...pageProps} />
    </AppProviders>
  );
}
