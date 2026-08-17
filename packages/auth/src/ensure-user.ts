import { clerkClient } from '@clerk/express';
import { prisma, type User } from '@biashara-mall/prisma';

/**
 * Returns the User row for a Clerk id, creating it on demand if the webhook
 * has not delivered yet (or never will — a rotated tunnel URL in dev, a user
 * who predates the endpoint, a dropped delivery).
 *
 * Clerk is only called on a miss, so the steady-state cost is one indexed
 * lookup. The webhook remains responsible for propagating later profile
 * updates and deletions, which this cannot observe.
 */
export async function ensureUser(clerkId: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkId);

  const primary =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    ) ?? clerkUser.emailAddresses[0];
  const email = primary?.emailAddress ?? `${clerkId}@no-email.local`;
  const name =
    `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || null;

  const isFirstUser = (await prisma.user.count()) === 0;

  // upsert, not create: a webhook delivery can land between the findUnique
  // above and this write.
  return prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email,
      name,
      avatarUrl: clerkUser.imageUrl ?? null,
      ...(isFirstUser && { role: 'admin' as const }),
    },
    update: {},
  });
}
