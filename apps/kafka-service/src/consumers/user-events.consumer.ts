import { kafka, TOPICS, type UserEvent, type UserEventAction } from '@biashara-mall/kafka';
import {
  updateProductAnalytics,
  updateShopAnalytics,
  updateUserAnalytics,
} from '../services/analytics.service';

const VALID_ACTIONS = new Set<UserEventAction>([
  'product_view',
  'add_to_cart',
  'remove_from_cart',
  'add_to_wishlist',
  'remove_from_wishlist',
  'shop_visit',
]);

const BATCH_INTERVAL_MS = 3000;
let eventQueue: UserEvent[] = [];
let processing = false;

function groupBy<T, K extends string>(items: T[], key: (item: T) => K | undefined) {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    if (k === undefined) continue;
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

// Grouped by entity so each user/product/shop gets exactly one read + one
// write per window, not one per event (see updateUserAnalytics for why).
async function processQueue() {
  if (processing || eventQueue.length === 0) return;
  processing = true;
  const batch = eventQueue;
  eventQueue = [];

  try {
    const byUser = groupBy(
      batch.filter((e) => e.action !== 'shop_visit'),
      (e) => e.clerkId,
    );
    const byProduct = groupBy(
      batch.filter((e) => e.productId),
      (e) => e.productId,
    );
    const byShop = groupBy(
      batch.filter((e) => e.action === 'shop_visit' && e.shopId),
      (e) => e.shopId,
    );

    const results = await Promise.allSettled([
      ...[...byUser.values()].map(updateUserAnalytics),
      ...[...byProduct.values()].map(updateProductAnalytics),
      ...[...byShop.values()].map(updateShopAnalytics),
    ]);
    const failed = results.filter((r) => r.status === 'rejected').length;
    console.log(
      `[user-events] processed ${batch.length} event(s) across ${results.length} write(s)${failed ? `, ${failed} failed` : ''}`,
    );
  } finally {
    processing = false;
  }
}

export async function startUserEventsConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: 'user-events-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.USERS_EVENTS.topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        const event = JSON.parse(message.value.toString()) as UserEvent;
        if (!VALID_ACTIONS.has(event.action)) {
          console.warn(`[user-events] dropping unknown action: ${event.action}`);
          return;
        }
        eventQueue.push(event);
      } catch (err) {
        console.error('[user-events] malformed message:', (err as Error).message);
      }
    },
  });

  setInterval(processQueue, BATCH_INTERVAL_MS);
  console.log('[user-events] consumer group "user-events-group" running');
}
