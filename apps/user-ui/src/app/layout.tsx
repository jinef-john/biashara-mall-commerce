import { ClerkProvider } from '@clerk/nextjs';
import { Header } from '../components/header';
import './global.css';

export const metadata = {
  title: 'Biashara Mall',
  description: 'Multi-vendor e-commerce marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <Header />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
