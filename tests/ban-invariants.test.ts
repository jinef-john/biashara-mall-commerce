import { beforeEach, describe, expect, mock, test } from 'bun:test';

const db = {
  user: {
    findUnique: mock(async () => null as unknown),
    update: mock(async () => ({})),
  },
};

mock.module('@biashara-mall/prisma', () => ({ prisma: db }));
mock.module('@biashara-mall/kafka', () => ({
  sendLog: mock(async () => undefined),
  produce: mock(async () => undefined),
}));

const { usersRouter } = await import('../apps/admin-service/src/routes/users');
const { withRouter, json } = await import('./helpers/router-app');

const ADMIN = { id: 'admin-1', role: 'admin' };
const target = (over: Record<string, unknown> = {}) => ({
  id: 'user-1',
  role: 'user',
  email: 'buyer@example.com',
  status: 'active',
  deletedAt: null,
  ...over,
});

function setStatus(banned: boolean, user = target()) {
  db.user.findUnique = mock(async () => user as unknown);
  db.user.update = mock(async () => ({
    ...user,
    status: banned ? 'banned' : 'active',
  }));
  return withRouter(usersRouter, ADMIN, (request) =>
    request(`/api/update-user-status/${user.id}`, {
      method: 'PUT',
      ...json({ banned }),
    }),
  );
}

beforeEach(() => {
  db.user.findUnique = mock(async () => null as unknown);
  db.user.update = mock(async () => ({}));
});

describe('ban is not deletion', () => {
  // The bug: the ban used to write deletedAt, the same field the Clerk
  // user.deleted webhook writes, so a banned account reported itself deleted.
  test('banning writes status and nothing else', async () => {
    await setStatus(true);
    const [args] = db.user.update.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(args.data).toEqual({ status: 'banned' });
    expect(args.data).not.toHaveProperty('deletedAt');
  });

  test('unbanning restores active and still leaves deletedAt alone', async () => {
    await setStatus(false, target({ status: 'banned' }));
    const [args] = db.user.update.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(args.data).toEqual({ status: 'active' });
    expect(args.data).not.toHaveProperty('deletedAt');
  });

  test('a ban round-trip leaves the account exactly as it started', async () => {
    await setStatus(true);
    const banPayload = (db.user.update.mock.calls[0] as [{ data: object }])[0]
      .data;
    await setStatus(false, target({ status: 'banned' }));
    const unbanPayload = (db.user.update.mock.calls[0] as [{ data: object }])[0]
      .data;

    expect(Object.keys({ ...banPayload, ...unbanPayload })).toEqual(['status']);
  });
});

describe('who can be banned', () => {
  test('not a platform admin', async () => {
    db.user.findUnique = mock(async () => target({ role: 'admin' }) as unknown);
    const res = await withRouter(usersRouter, ADMIN, (request) =>
      request('/api/update-user-status/user-1', {
        method: 'PUT',
        ...json({ banned: true }),
      }),
    );
    expect(res.status).toBe(403);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  test('not yourself', async () => {
    db.user.findUnique = mock(async () => target({ id: ADMIN.id }) as unknown);
    const res = await withRouter(usersRouter, ADMIN, (request) =>
      request(`/api/update-user-status/${ADMIN.id}`, {
        method: 'PUT',
        ...json({ banned: true }),
      }),
    );
    expect(res.status).toBe(403);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  test('not someone who does not exist', async () => {
    const res = await withRouter(usersRouter, ADMIN, (request) =>
      request('/api/update-user-status/nobody', {
        method: 'PUT',
        ...json({ banned: true }),
      }),
    );
    expect(res.status).toBe(404);
  });

  test('"banned" has to be a boolean, not a truthy string', async () => {
    const res = await withRouter(usersRouter, ADMIN, (request) =>
      request('/api/update-user-status/user-1', {
        method: 'PUT',
        ...json({ banned: 'yes' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
