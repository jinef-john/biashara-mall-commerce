import { SignInButton, Show, UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6 py-4">
      <span className="text-headline-sm text-on-surface">
        Biashara Mall — Admin
      </span>
      <div className="flex items-center gap-4">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded bg-primary px-4 py-2 text-label-md text-on-primary hover:opacity-90">
              Sign in
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
