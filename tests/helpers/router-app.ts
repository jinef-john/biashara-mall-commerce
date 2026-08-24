import express, { type Router } from 'express';
import { createErrorMiddleware } from '@biashara-mall/error-handler';

export interface TestUser {
  id: string;
  role?: string;
  status?: string;
}

/** Mounts one router on a throwaway server so a handler's behaviour can be
 * driven over HTTP. Auth is stubbed: whether the guards are wired correctly is
 * suspension-coverage.test.ts's job, not this one's. */
export async function withRouter<T>(
  router: Router,
  appUser: TestUser | null,
  run: (
    request: (path: string, init?: RequestInit) => Promise<Response>,
  ) => Promise<T>,
): Promise<T> {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (appUser)
      (req as express.Request & { appUser: TestUser }).appUser = appUser;
    next();
  });
  app.use('/api', router);
  app.use(createErrorMiddleware('test'));

  const server = app.listen(0);
  try {
    const { port } = server.address() as { port: number };
    return await run((path, init) =>
      fetch(`http://localhost:${port}${path}`, {
        ...init,
        headers: { 'content-type': 'application/json', ...init?.headers },
      }),
    );
  } finally {
    server.close();
  }
}

export const json = (body: unknown): RequestInit => ({
  body: JSON.stringify(body),
});
