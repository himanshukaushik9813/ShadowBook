import '@cofhe/react/styles.css';
import '../styles/tailwind.css';

import AppProviders from '../components/AppProviders';

export const metadata = {
  title: 'ShadowBook',
  description: 'Private execution workspace',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
