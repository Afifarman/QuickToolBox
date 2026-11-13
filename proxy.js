import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_URL } from './lib/supabase/config';

// Only pages that genuinely need an account are gated. /settings, /favorites,
// /history and /saved read and write localStorage only, so guests can use them.
const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/api/ai-agent'];
const ADMIN_PREFIX = '/admin';

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const needsAdmin = pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
  const isAiApi = pathname.startsWith('/api/ai/') || pathname === '/api/ai' || pathname.startsWith('/api/ai-agent/') || pathname === '/api/ai-agent';
  if (!needsAuth && !needsAdmin) return NextResponse.next();

  const response = NextResponse.next({ request });
  // Keep middleware auth on the same verified Supabase project key as OAuth callback.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) return NextResponse.redirect(new URL('/login?error=supabase_not_configured', request.url));

  const supabase = createServerClient(SUPABASE_URL, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (isAiApi) {
      return NextResponse.json(
        { error: 'Login required to use QuickToolBox AI.', code: 'LOGIN_REQUIRED' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
  }

  if (needsAdmin) {
    const admins = String(process.env.ADMIN_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
    const isAdmin = admins.includes(String(user.email || '').toLowerCase());
    if (!isAdmin) return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/api/ai-agent/:path*', '/admin/:path*'],
};
