import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getRequestOrigin } from '../../../lib/supabase/auth-redirect';

function safeNextPath(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = safeNextPath(requestUrl.searchParams.get('next'));
  const origin = getRequestOrigin(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL('/login?error=supabase_not_configured', origin));
  }

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL('/login?error=missing_oauth_code', origin));
  }

  const successResponse = NextResponse.redirect(new URL(next, origin));
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          successResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        type: type || 'email',
        token_hash: tokenHash,
      });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    );
  }

  return successResponse;
}
