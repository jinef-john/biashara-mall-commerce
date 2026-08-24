import { beforeEach, describe, expect, mock, test } from 'bun:test';

const auth = { userId: 'clerk_1', orgId: 'org_1', orgRole: 'org:admin' };
let owner = { id: 'u1', status: 'active' };

mock.module('@clerk/express', () => ({ getAuth: () => auth }));
mock.module('@biashara-mall/auth', () => ({ ensureUser: async () => owner }));
mock.module('@biashara-mall/prisma', () => ({
  prisma: {
    shops: {
      upsert: async (args: { create: object }) => ({
        id: 'shop-1',
        ...args.create,
      }),
    },
  },
}));
mock.module('@biashara-mall/kafka', () => ({ sendLog: async () => undefined }));

const { shopsRouter } = await import('../apps/seller-service/src/routes/shops');
const { withRouter, json } = await import('./helpers/router-app');

const createShop = (body: Record<string, unknown> = { name: 'Test Shop' }) =>
  withRouter(shopsRouter, null, (request) =>
    request('/api', { method: 'POST', ...json(body) }),
  );

beforeEach(() => {
  owner = { id: 'u1', status: 'active' };
  Object.assign(auth, {
    userId: 'clerk_1',
    orgId: 'org_1',
    orgRole: 'org:admin',
  });
});

describe('opening a shop', () => {
  // Hiding "Become a seller" in user-ui is not the control: a suspended buyer
  // can go straight to seller-ui and post this themselves.
  test('a suspended account is refused, with the code the client keys off', async () => {
    owner = { id: 'u1', status: 'banned' };
    const res = await createShop();
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'ACCOUNT_SUSPENDED' });
  });

  test('an active account gets through', async () => {
    const res = await createShop();
    expect(res.status).toBe(201);
  });

  test('suspension is checked before the shop name is', async () => {
    owner = { id: 'u1', status: 'banned' };
    const res = await createShop({});
    expect(res.status).toBe(403);
  });

  test('a member who is not the org admin cannot', async () => {
    auth.orgRole = 'org:member';
    expect((await createShop()).status).toBe(403);
  });

  test('no active organisation is a bad request, not a suspension', async () => {
    auth.orgId = '';
    const res = await createShop();
    expect(res.status).toBe(400);
    expect(await res.json()).not.toMatchObject({ code: 'ACCOUNT_SUSPENDED' });
  });

  test('signed out is rejected outright', async () => {
    auth.userId = '';
    expect((await createShop()).status).toBe(401);
  });
});
