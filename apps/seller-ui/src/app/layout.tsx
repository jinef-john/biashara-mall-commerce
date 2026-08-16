import { ClerkProvider } from '@clerk/nextjs';
import { Header } from '../components/header';
import './global.css';

export const metadata = {
  title: 'Biashara Mall — Seller',
  description: 'Seller dashboard for Biashara Mall',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        >
          <Header />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
