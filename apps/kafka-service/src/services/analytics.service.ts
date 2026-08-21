import { ensureUser } from '@biashara-mall/auth';
import { prisma, type UserAction } from '@biashara-mall/prisma';
import type { UserEvent } from '@biashara-mall/kafka';

const MAX_ACTIONS = 100;

function formatDevice(event: UserEvent): string | undefined {
  if (!event.deviceType && !event.browser && !event.os) return undefined;
  return [event.deviceType, event.browser, event.os].filter(Boolean).join(' · ');
}

/**
 * Applies the transcript's dedup rules for cart/wishlist actions so the
 * actions array reflects current state, not a raw event log: product_view
 * always appends; add_to_cart/add_to_wishlist append once per product;
 * remove_from_cart/remove_from_wishlist drop the matching add instead of
 * appending a "removal" entry.
 */
function applyAction(actions: UserAction[], event: UserEvent) {
  const matches = (a: UserAction, action: string) =>
    a.action === action && a.productId === (event.productId ?? null);

  switch (event.action) {
    case 'product_view':
      actions.push({
        productId: event.productId ?? null,
        shopId: event.shopId ?? null,
        action: event.action,
        timestamp: new Date(event.timestamp),
      });
      break;
    case 'add_to_cart':
    case 'add_to_wishlist':
      if (!actions.some((a) => matches(a, event.action))) {
        actions.push({
          productId: event.productId ?? null,
          shopId: event.shopId ?? null,
          action: event.action,
          timestamp: new Date(event.timestamp),
        });
      }
      break;
    case 'remove_from_cart':
      return actions.filter((a) => !matches(a, 'add_to_cart'));
    case 'remove_from_wishlist':
      return actions.filter((a) => !matches(a, 'add_to_wishlist'));
  }
  return actions;
}

/**
 * One call per user per batch window, folding every one of that user's
 * queued events into a single read + single write. Calling this once per
 * *event* instead (each with its own read-modify-write) is a lost-update
 * race: concurrent upserts on the same UserAnalytics document all read the
 * same "existing" state and the last write wins, silently dropping the
 * others. Grouping by user first is what makes "one bulk write per 3s
 * window" in the plan actually true, not just batched timing.
 */
export async function updateUserAnalytics(events: UserEvent[]): Promise<void> {
  if (events.length === 0) return;
  const clerkId = events[0].clerkId;

  const user = await ensureUser(clerkId);
  const existing = await prisma.userAnalytics.findUnique({ where: { userId: user.id } });

  let actions = [...(existing?.actions ?? [])];
  for (const event of events) actions = applyAction(actions, event);
  actions = actions.slice(-MAX_ACTIONS);

  const last = events[events.length - 1];
  const device = formatDevice(last);

  await prisma.userAnalytics.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      country: last.country,
      city: last.city,
      device,
      lastVisited: new Date(last.timestamp),
      actions,
    },
    update: {
      country: last.country ?? existing?.country,
      city: last.city ?? existing?.city,
      device: device ?? existing?.device,
      lastVisited: new Date(last.timestamp),
      actions: { set: actions },
    },
  });
}

const PRODUCT_COUNTER_FIELD = {
  product_view: 'views',
  add_to_cart: 'cartAdds',
  add_to_wishlist: 'wishlistAdds',
} as const;

/** One call per product per batch window — see updateUserAnalytics for why. */
export async function updateProductAnalytics(events: UserEvent[]): Promise<void> {
  if (events.length === 0) return;
  const productId = events[0].productId!;

  const increments: Record<string, number> = {};
  for (const event of events) {
    const field = PRODUCT_COUNTER_FIELD[event.action as keyof typeof PRODUCT_COUNTER_FIELD];
    if (field) increments[field] = (increments[field] ?? 0) + 1;
  }
  if (Object.keys(increments).length === 0) return;

  await prisma.productAnalytics.upsert({
    where: { productId },
    create: { productId, ...increments },
    update: Object.fromEntries(
      Object.entries(increments).map(([field, count]) => [field, { increment: count }]),
    ),
  });
}

function tally(events: UserEvent[], pick: (e: UserEvent) => string | undefined) {
  const counts: Record<string, number> = {};
  for (const event of events) {
    const key = pick(event);
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function mergeCounts(existing: unknown, delta: Record<string, number>) {
  const map = existing && typeof existing === 'object' ? { ...(existing as Record<string, number>) } : {};
  for (const [key, count] of Object.entries(delta)) map[key] = (map[key] ?? 0) + count;
  return map;
}

/** One call per shop per batch window — see updateUserAnalytics for why. */
export async function updateShopAnalytics(events: UserEvent[]): Promise<void> {
  if (events.length === 0) return;
  const shopId = events[0].shopId!;

  const existing = await prisma.shopAnalytics.findUnique({ where: { shopId } });
  const countryStats = mergeCounts(existing?.countryStats, tally(events, (e) => e.country));
  const cityStats = mergeCounts(existing?.cityStats, tally(events, (e) => e.city));
  const deviceStats = mergeCounts(existing?.deviceStats, tally(events, (e) => e.deviceType));

  await prisma.shopAnalytics.upsert({
    where: { shopId },
    create: { shopId, countryStats, cityStats, deviceStats, visitors: events.length },
    update: { countryStats, cityStats, deviceStats, visitors: { increment: events.length } },
  });
}
