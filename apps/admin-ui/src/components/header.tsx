import { SignInButton, Show, UserButton } from '@clerk/nextjs';
import { Button } from '@biashara-mall/ui/components/ui/button';

export function Header({ leading }: { leading?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4">
      <div className="flex items-center gap-3">
        {leading}
        <span className="text-headline-sm text-on-surface">
          Biashara Mall — Admin
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="ghost">Sign in</Button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
