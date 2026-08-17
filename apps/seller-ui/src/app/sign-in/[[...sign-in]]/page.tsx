import { SignIn } from '@clerk/nextjs';
import { Header } from '../../../components/header';

export default function SignInPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100svh-var(--header-height))] items-center justify-center bg-surface">
        <SignIn fallbackRedirectUrl="/" />
      </main>
    </>
  );
}
