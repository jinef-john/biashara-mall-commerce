import { describe, expect, test } from 'bun:test';
import type { Router } from 'express';

import { conversationsRouter } from '../apps/chatting-service/src/routes/conversations';
import { ordersRouter } from '../apps/order-service/src/routes/orders';
import { paymentRouter } from '../apps/order-service/src/routes/payment';
import { followRouter } from '../apps/seller-service/src/routes/follow';
import { shopsRouter } from '../apps/seller-service/src/routes/shops';
import { addressesRouter } from '../apps/user-service/src/routes/addresses';
import { meRouter } from '../apps/user-service/src/routes/me';
import { notificationsRouter } from '../apps/user-service/src/routes/notifications';
import { recommendationsRouter } from '../apps/recommendation-service/src/routes/recommendations';

// Routers a signed-in buyer can reach. Everything mounted here needs
// requireActiveUser unless it is listed in ALLOWED below with a reason.
const BUYER_ROUTERS: Record<string, Router> = {
  'chatting-service/conversations': conversationsRouter,
  'order-service/orders': ordersRouter,
  'order-service/payment': paymentRouter,
  'seller-service/follow': followRouter,
  'seller-service/shops': shopsRouter,
  'user-service/addresses': addressesRouter,
  'user-service/me': meRouter,
  'user-service/notifications': notificationsRouter,
  'recommendation-service/recommendations': recommendationsRouter,
};

// Guards for a different audience. A seller- or admin-scoped route is not a
// buyer route, so it is out of scope rather than an exception.
const OTHER_AUDIENCE = new Set(['requireShop', 'requireAdmin']);

const ALLOWED: Record<string, string> = {
  // A suspended account keeps read access to orders it already placed.
  'order-service/orders GET /get-user-orders':
    'suspended users keep order history',
  'order-service/orders GET /get-order-details/:id':
    'suspended users keep order history',
  // Suspension has to be visible to the client before it can render the banner,
  // so the endpoint that reports it cannot itself reject suspended users.
  'user-service/me GET /': 'reports status, must answer while suspended',
  'user-service/notifications GET /': 'order updates keep arriving',
  'user-service/notifications POST /mark-notification-as-read':
    'order updates keep arriving',
  // Guards inline with getAuth + a status check instead of middleware, so the
  // stack cannot see it. See requireShopOwner in that file.
  'seller-service/shops POST /branding-image': 'inline requireShopOwner',
  'seller-service/shops DELETE /branding-image/:fileId':
    'inline requireShopOwner',
  'seller-service/shops POST /': 'inline getAuth + ACCOUNT_SUSPENDED check',
  'seller-service/shops PATCH /': 'inline getAuth',
  'seller-service/shops GET /me': 'inline getAuth',
};

interface RouteInfo {
  key: string;
  guards: string[];
}

function routesOf(name: string, router: Router): RouteInfo[] {
  const stack = (router as unknown as { stack: RouteLayer[] }).stack ?? [];
  return stack.flatMap(({ route }) => {
    if (!route) return [];
    const guards = (route.stack ?? [])
      .map((entry) => entry.name)
      .filter((entryName) => entryName && entryName !== '<anonymous>');
    return Object.keys(route.methods)
      .filter((method) => method !== '_all')
      .map((method) => ({
        key: `${name} ${method.toUpperCase()} ${route.path}`,
        guards,
      }));
  });
}

interface RouteLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: { name: string }[];
  };
}

const allRoutes = Object.entries(BUYER_ROUTERS).flatMap(([name, router]) =>
  routesOf(name, router),
);

describe('suspension coverage', () => {
  test('every buyer route is guarded or explicitly excepted', () => {
    const unguarded = allRoutes
      .filter((route) => !route.guards.includes('requireActiveUser'))
      .filter(
        (route) => !route.guards.some((guard) => OTHER_AUDIENCE.has(guard)),
      )
      .filter((route) => !(route.key in ALLOWED))
      .map(
        (route) => `${route.key}  [${route.guards.join(', ') || 'no guard'}]`,
      );

    expect(unguarded).toEqual([]);
  });

  // An exception that is no longer needed is not harmless: it would let a
  // later removal of the guard pass unnoticed.
  test('no stale or redundant exceptions', () => {
    const byKey = new Map(allRoutes.map((route) => [route.key, route]));
    const dead = Object.keys(ALLOWED).map((key) => {
      const route = byKey.get(key);
      if (!route) return `${key} — no such route`;
      if (route.guards.includes('requireActiveUser'))
        return `${key} — now guarded`;
      if (route.guards.some((guard) => OTHER_AUDIENCE.has(guard)))
        return `${key} — now ${route.guards.join('/')}`;
      return null;
    });

    expect(dead.filter(Boolean)).toEqual([]);
  });

  test('the routers actually loaded', () => {
    expect(allRoutes.length).toBeGreaterThan(20);
  });
});
