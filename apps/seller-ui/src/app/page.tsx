import { auth } from '@clerk/nextjs/server';
import { Header } from '../components/header';
import { SellerLanding } from '../components/seller-landing';
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

    // Onboarding is finished: the dashboard is the real landing page.
    redirect('/dashboard/create-product');
  }

  return (
    <>
      <Header />
      <SellerLanding />
    </>
  );
}
