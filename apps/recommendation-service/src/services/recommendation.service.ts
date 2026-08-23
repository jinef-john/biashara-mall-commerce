import * as tf from '@tensorflow/tfjs-node';
import { prisma, type UserAction } from '@biashara-mall/prisma';

const EMBEDDING_DIM = 16;
// Validation loss bottoms out after the first pass and climbs from there:
// with ~200 users over a 5k catalogue there are too few observations per item
// to fit more than this without memorising exact pairs. See plan.md.
const EPOCHS = 2;
const BATCH_SIZE = 256;
// Implicit feedback records only what happened, so every observed interaction
// is a positive. Training on positives alone makes "predict high for
// everything" optimal and the embeddings learn nothing — each positive needs
// unobserved products alongside it as negatives.
const NEGATIVES_PER_POSITIVE = 4;
export const MIN_ACTIONS = 15;
export const RETRAIN_AFTER_MS = 3 * 60 * 60 * 1000;
const TOP_N = 10;

// Implicit-feedback weights: a purchase is a far stronger endorsement than a
// glance at a listing.
const ACTION_WEIGHT: Record<string, number> = {
  purchase: 1,
  add_to_cart: 0.7,
  add_to_wishlist: 0.5,
  product_view: 0.1,
};

interface Interaction {
  userIndex: number;
  productIndex: number;
  weight: number;
}

function sampleNegatives(
  userIndex: number,
  positives: Set<number>,
  productCount: number,
  count: number,
): Interaction[] {
  const out: Interaction[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 10) {
    guard++;
    const productIndex = Math.floor(Math.random() * productCount);
    if (positives.has(productIndex)) continue;
    out.push({ userIndex, productIndex, weight: 0 });
  }
  return out;
}

/** Highest weight wins per (user, product): a viewed-then-bought pair is a buy. */
function collapse(actions: UserAction[], productIndex: Map<string, number>, userIndex: number) {
  const best = new Map<number, number>();
  for (const action of actions) {
    if (!action.productId) continue;
    const index = productIndex.get(action.productId);
    if (index === undefined) continue;
    const weight = ACTION_WEIGHT[action.action];
    if (weight === undefined) continue;
    best.set(index, Math.max(best.get(index) ?? 0, weight));
  }
  return [...best].map(([productIdx, weight]) => ({
    userIndex,
    productIndex: productIdx,
    weight,
  }));
}

function buildModel(userCount: number, productCount: number) {
  const userInput = tf.input({ shape: [1], dtype: 'int32', name: 'user' });
  const productInput = tf.input({ shape: [1], dtype: 'int32', name: 'product' });

  const userVector = tf.layers
    .flatten()
    .apply(
      tf.layers
        .embedding({ inputDim: userCount, outputDim: EMBEDDING_DIM })
        .apply(userInput),
    ) as tf.SymbolicTensor;

  const productVector = tf.layers
    .flatten()
    .apply(
      tf.layers
        .embedding({ inputDim: productCount, outputDim: EMBEDDING_DIM })
        .apply(productInput),
    ) as tf.SymbolicTensor;

  const dot = tf.layers
    .dot({ axes: 1 })
    .apply([userVector, productVector]) as tf.SymbolicTensor;

  const output = tf.layers
    .dense({ units: 1, activation: 'sigmoid' })
    .apply(dot) as tf.SymbolicTensor;

  const model = tf.model({ inputs: [userInput, productInput], outputs: output });
  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
  return model;
}

export async function trainAndRecommend(targetUserId: string): Promise<string[]> {
  const [analytics, products] = await Promise.all([
    prisma.userAnalytics.findMany({ select: { userId: true, actions: true } }),
    prisma.product.findMany({
      where: { isDeleted: false, status: 'active' },
      select: { id: true },
    }),
  ]);

  const productIndex = new Map(products.map((p, i) => [p.id, i]));
  const productIds = products.map((p) => p.id);

  const userIndex = new Map<string, number>();
  const interactions: Interaction[] = [];
  const positivesByUser = new Map<number, Set<number>>();

  for (const row of analytics) {
    if (!userIndex.has(row.userId)) userIndex.set(row.userId, userIndex.size);
    const index = userIndex.get(row.userId)!;
    const positives = collapse(row.actions, productIndex, index);
    if (positives.length === 0) continue;

    interactions.push(...positives);
    const seen = new Set(positives.map((p) => p.productIndex));
    positivesByUser.set(index, seen);
    interactions.push(
      ...sampleNegatives(
        index,
        seen,
        products.length,
        positives.length * NEGATIVES_PER_POSITIVE,
      ),
    );
  }

  const target = userIndex.get(targetUserId);
  if (target === undefined || interactions.length === 0) return [];

  // Only rank products the model actually saw. An item with no interactions
  // keeps its random initial embedding, which scores arbitrarily — that is how
  // untouched catalogue filler ends up at the top of every list.
  const trained = new Set<number>();
  for (const set of positivesByUser.values()) {
    for (const index of set) trained.add(index);
  }

  const model = buildModel(userIndex.size, products.length);

  const userTensor = tf.tensor2d(interactions.map((i) => [i.userIndex]), undefined, 'int32');
  const productTensor = tf.tensor2d(interactions.map((i) => [i.productIndex]), undefined, 'int32');
  const labelTensor = tf.tensor2d(interactions.map((i) => [i.weight]));

  try {
    await model.fit([userTensor, productTensor], labelTensor, {
      epochs: EPOCHS,
      batchSize: BATCH_SIZE,
      verbose: 0,
    });

    const seen = positivesByUser.get(target) ?? new Set<number>();

    const candidates = [...trained].filter((index) => !seen.has(index));

    const scoreUser = tf.tensor2d(candidates.map(() => [target]), undefined, 'int32');
    const scoreProduct = tf.tensor2d(candidates.map((i) => [i]), undefined, 'int32');

    try {
      const predictions = model.predict([scoreUser, scoreProduct]) as tf.Tensor;
      const scores = Array.from(await predictions.data());
      predictions.dispose();

      return candidates
        .map((index, i) => ({ id: productIds[index], score: scores[i] }))
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_N)
        .map((entry) => entry.id);
    } finally {
      scoreUser.dispose();
      scoreProduct.dispose();
    }
  } finally {
    userTensor.dispose();
    productTensor.dispose();
    labelTensor.dispose();
    model.dispose();
  }
}
