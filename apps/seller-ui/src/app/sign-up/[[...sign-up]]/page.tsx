import { SignUp } from '@clerk/nextjs';
import { Header } from '../../../components/header';

export default function SignUpPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100svh-var(--header-height))] items-center justify-center bg-surface">
        <SignUp fallbackRedirectUrl="/onboarding" />
      </main>
    </>
  );
}
