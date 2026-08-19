import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * Middleware that refreshes the Supabase auth session on every request.
 *
 * This is essential for the PKCE OAuth flow: the auth code exchange sets
 * session cookies on the /auth/callback response, and the middleware
 * ensures those cookies are refreshed on subsequent navigation so the
 * session does not silently expire.
 *
 * It also prevents unauthenticated access to protected routes
 * (/dashboard, /profile, /favorites, /history, /saved, /settings).
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/favorites',
  '/history',
  '/saved',
  '/settings',
];

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Supabase not configured — allow access but auth will fail gracefully
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const isSecure =
            options?.secure ??
            (process.env.NODE_ENV === 'production' ||
              request.url?.startsWith('https:'));
          response.cookies.set(name, value, {
            ...options,
            sameSite: options?.sameSite ?? 'lax',
            secure: isSecure,
            httpOnly: options?.httpOnly ?? false,
            path: options?.path ?? '/',
          });
        });
      },
    },
  });

  // Refresh session — this also reads/extends the cookie lifetime
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static assets and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};