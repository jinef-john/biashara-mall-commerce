import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { Toaster } from '@biashara-mall/ui/components/ui/sonner';
import { QueryProvider } from '../components/query-provider';
import { Header } from '../components/header';
import { CartSidebar } from '../shared/components/cart-sidebar';
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
            <div className="flex">
              <div className="min-w-0 flex-1">
                <Header />
                {children}
              </div>
              <CartSidebar />
            </div>
          </QueryProvider>
          <Toaster position="bottom-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
