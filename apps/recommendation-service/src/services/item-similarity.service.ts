import { prisma, type UserAction } from '@biashara-mall/prisma';

const TOP_N = 10;
// Rank first, then verify. The scoring pass touches thousands of candidates and
// asking Mongo about all of them costs far more than the arithmetic does.
const VERIFY_POOL = 60;
export const MIN_ACTIONS = 15;

const ACTION_WEIGHT: Record<string, number> = {
  purchase: 1,
  add_to_cart: 0.7,
  add_to_wishlist: 0.5,
  product_view: 0.1,
};

// Damps items that co-occur with everything. Without it the ranking collapses
// to "whatever is most popular", which is not a recommendation.
const SHRINK = 10;
const INDEX_TTL_MS = 5 * 60 * 1000;

interface Index {
  byUser: Map<string, Map<string, number>>;
  byItem: Map<string, Map<string, number>>;
  norm: Map<string, number>;
  builtAt: number;
}

// Reading every interaction and rebuilding the maps dominates the cost, and the
// index is identical for every user, so it is built once and shared.
let index: Index | undefined;
let building: Promise<Index> | undefined;

async function buildIndex(): Promise<Index> {
  const analytics = await prisma.userAnalytics.findMany({
    select: { userId: true, actions: true },
  });

  const byUser = new Map<string, Map<string, number>>();
  const byItem = new Map<string, Map<string, number>>();

  for (const row of analytics) {
    const weights = weightsOf(row.actions);
    if (weights.size === 0) continue;
    byUser.set(row.userId, weights);
    for (const [productId, weight] of weights) {
      if (!byItem.has(productId)) byItem.set(productId, new Map());
      byItem.get(productId)!.set(row.userId, weight);
    }
  }

  const norm = new Map<string, number>();
  for (const [productId, users] of byItem) {
    let sum = 0;
    for (const weight of users.values()) sum += weight * weight;
    norm.set(productId, Math.sqrt(sum));
  }

  return { byUser, byItem, norm, builtAt: Date.now() };
}

async function getIndex(): Promise<Index> {
  if (index && Date.now() - index.builtAt < INDEX_TTL_MS) return index;
  if (!building) {
    building = buildIndex().finally(() => {
      building = undefined;
    });
  }
  index = await building;
  return index;
}

export function weightsOf(actions: UserAction[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const action of actions) {
    if (!action.productId) continue;
    const weight = ACTION_WEIGHT[action.action];
    if (weight === undefined) continue;
    best.set(
      action.productId,
      Math.max(best.get(action.productId) ?? 0, weight),
    );
  }
  return best;
}

/**
 * Item-to-item collaborative filtering: score a candidate by how strongly it
 * co-occurs with what this user already liked, cosine-normalised so a popular
 * item does not win on volume alone.
 *
 * No training and no model — the whole thing is one pass over the interaction
 * index, which is why it works at a density where matrix factorisation cannot.
 */
export async function recommendSimilarItems(
  targetUserId: string,
): Promise<string[]> {
  const { byUser, byItem, norm } = await getIndex();

  const seen = byUser.get(targetUserId);
  if (!seen || seen.size === 0) return [];

  const scores = new Map<string, number>();
  const overlap = new Map<string, number>();

  for (const [likedId, likedWeight] of seen) {
    const raters = byItem.get(likedId);
    const likedNorm = norm.get(likedId);
    if (!raters || !likedNorm) continue;

    for (const [otherUserId, ratingOfLiked] of raters) {
      if (otherUserId === targetUserId) continue;
      const theirItems = byUser.get(otherUserId);
      if (!theirItems) continue;

      for (const [candidateId, ratingOfCandidate] of theirItems) {
        if (seen.has(candidateId)) continue;
        const candidateNorm = norm.get(candidateId);
        if (!candidateNorm) continue;

        const contribution =
          (likedWeight * ratingOfLiked * ratingOfCandidate) /
          (likedNorm * candidateNorm);
        scores.set(candidateId, (scores.get(candidateId) ?? 0) + contribution);
        overlap.set(candidateId, (overlap.get(candidateId) ?? 0) + 1);
      }
    }
  }

  const ranked = [...scores]
    .map(([id, score]) => {
      const co = overlap.get(id) ?? 0;
      return { id, score: score * (co / (co + SHRINK)) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, VERIFY_POOL);

  const active = await prisma.product.findMany({
    where: {
      id: { in: ranked.map((r) => r.id) },
      isDeleted: false,
      status: 'active',
    },
    select: { id: true },
  });
  const sellable = new Set(active.map((p) => p.id));

  return ranked
    .filter((entry) => sellable.has(entry.id))
    .slice(0, TOP_N)
    .map((entry) => entry.id);
}
