import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-lg py-md">
      <span className="text-headline-sm text-on-surface">Biashara Mall</span>
      <div className="flex items-center gap-md">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="text-label-md text-primary hover:opacity-80">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded bg-primary px-md py-sm text-label-md text-on-primary hover:opacity-90">
              Sign up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
