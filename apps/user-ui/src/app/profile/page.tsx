import { AddressSection } from '../../shared/components/address-section';

export const metadata = {
  title: 'Your profile — Biashara Mall',
};

export default function ProfilePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8">
      <h1 className="text-headline-lg text-on-surface">Profile</h1>
      <AddressSection />
    </main>
  );
}
