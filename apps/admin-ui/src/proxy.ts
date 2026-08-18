import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return undefined;

  await auth.protect();

  const { sessionClaims } = await auth();
  if (sessionClaims?.metadata?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return undefined;
});

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
    '/',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
