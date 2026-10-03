import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/settings', '/favorites', '/history', '/saved'];
const ADMIN_PREFIX = '/admin';

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const needsAdmin = pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
  if (!needsAuth && !needsAdmin) return NextResponse.next();

  const response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(new URL('/login?error=supabase_not_configured', request.url));

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));

  if (needsAdmin) {
    const admins = String(process.env.ADMIN_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
    const isAdmin = admins.includes(String(user.email || '').toLowerCase());
    if (!isAdmin) return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/settings/:path*', '/favorites/:path*', '/history/:path*', '/saved/:path*', '/admin/:path*'],
};
