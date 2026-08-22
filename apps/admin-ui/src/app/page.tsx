import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SignInButton } from '@clerk/nextjs';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Header } from '../components/header';

export default async function Home() {
  const { userId, sessionClaims } = await auth();
  const isAdmin = sessionClaims?.metadata?.role === 'admin';

  if (userId && isAdmin) redirect('/dashboard');

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
        {userId ? (
          <>
            <ShieldAlert className="size-8 text-on-surface-variant" />
            <div>
              <h1 className="text-headline-md text-on-surface">
                You don&apos;t have admin access
              </h1>
              <p className="text-body-md text-on-surface-variant">
                This dashboard is limited to platform administrators.
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-headline-md text-on-surface">
                Biashara Mall admin
              </h1>
              <p className="text-body-md text-on-surface-variant">
                Sign in to manage the marketplace.
              </p>
            </div>
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          </>
        )}
      </main>
    </>
  );
}
