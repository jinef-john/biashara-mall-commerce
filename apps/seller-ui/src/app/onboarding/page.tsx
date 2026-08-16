import { CreateOrganization } from '@clerk/nextjs';

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-lg bg-surface px-md">
      <div className="text-center">
        <h1 className="text-headline-lg text-on-surface">
          Set up your shop
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Your shop is how buyers will find you on Biashara Mall.
        </p>
      </div>
      <CreateOrganization afterCreateOrganizationUrl="/onboarding/shop-details" />
    </main>
  );
}
