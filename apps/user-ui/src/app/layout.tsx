import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { Toaster } from '@biashara-mall/ui/components/ui/sonner';
import { QueryProvider } from '../components/query-provider';
import { Header } from '../components/header';
import './global.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        >
          <QueryProvider>
            <Header />
            {children}
          </QueryProvider>
          <Toaster position="bottom-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
