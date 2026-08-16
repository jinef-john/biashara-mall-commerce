import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId, orgId } = await auth();

  if (userId && !orgId) {
    redirect('/onboarding');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-sm bg-surface">
      <h1 className="text-headline-xl text-on-surface">
        Biashara Mall — Seller
      </h1>
      <p className="text-body-md text-on-surface-variant">
        seller-ui is running
      </p>
    </main>
  );
}
