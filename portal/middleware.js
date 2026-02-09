import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/lessons',
  '/lessons/(.*)',
  '/api/(.*)',
  '/icon.svg',
  '/favicon.ico',
  '/artifacts(.*)',
  '/schools(.*)',
  '/schools/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|woff2?|midi?|webmanifest)).*)', '/(api|trpc)(.*)'],
};
