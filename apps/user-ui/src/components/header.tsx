import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
      <span className="text-lg font-semibold text-neutral-100">
        Biashara Mall
      </span>
      <div className="flex items-center gap-4">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="text-sm text-neutral-300 hover:text-neutral-100">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-white">
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
