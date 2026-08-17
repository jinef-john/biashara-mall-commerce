import { auth } from '@clerk/nextjs/server';
import { Header } from '../components/header';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId, orgId, getToken } = await auth();

  if (userId && !orgId) {
    redirect('/onboarding');
  }

  if (userId && orgId) {
    const token = await getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/seller/api/shops/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    const data = await res.json();
    if (!data.shop) {
      redirect('/onboarding/shop-details');
    }

    // Onboarding is finished — the dashboard is the real landing page.
    redirect('/dashboard/create-product');
  }

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100svh-var(--header-height))] flex-col items-center justify-center gap-2 bg-surface">
        <h1 className="text-headline-xl text-on-surface">
          Biashara Mall — Seller
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Sign in to manage your shop.
        </p>
      </main>
    </>
  );
}
