import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../../lib/supabase/server';
import { getRequestOrigin, safeNextPath } from '../../../lib/supabase/auth-redirect';

/**
 * Auth callback route — handles OAuth PKCE code exchange and
 * email-link / OTP verification.
 *
 * This route is the redirectTo target for signInWithOAuth and
 * signUp email confirmation links. It must be listed exactly in
 * the Supabase Redirect URLs allowlist (no extra query params).
 *
 * PKCE flow:
 *   1. User clicks "Continue with Google"
 *   2. Supabase redirects to Google, passing a code_challenge
 *   3. Google authorises and redirects back to Supabase
 *   4. Supabase redirects here with ?code=<auth_code>
 *   5. We exchange the code for a session (PKCE verifier in cookie)
 *   6. Session cookies are set on the response
 *   7. Middleware refreshes the session on subsequent requests
 */
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

  // Validate required config
  if (!supabaseUrl || !supabaseKey) {
    console.error('Auth callback: Supabase environment variables not set');
    return NextResponse.redirect(
      new URL('/login?error=supabase_not_configured', origin)
    );
  }

  // Must have either an OAuth code or a token_hash (email link / OTP)
  if (!code && !tokenHash) {
    console.error('Auth callback: missing auth code and token_hash');
    return NextResponse.redirect(
      new URL('/login?error=missing_oauth_code', origin)
    );
  }

  // Create the success response early so we can attach cookies to it
  const redirectTarget = new URL(next, origin);
  const successResponse = NextResponse.redirect(redirectTarget);

  // Create a route-handler-specific Supabase client that writes cookies
  // to the response object
  const supabase = createRouteHandlerClient(request, successResponse);

  // Exchange the authorisation code for a session (PKCE)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback: code exchange failed', error.message);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          origin
        )
      );
    }

    return successResponse;
  }

  // Handle email-link / OTP verification (magic link, email change, etc.)
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: type || 'email',
      token_hash: tokenHash,
    });

    if (error) {
      console.error('Auth callback: OTP verification failed', error.message);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error.message)}`,
          origin
        )
      );
    }

    return successResponse;
  }

  // Unreachable — both conditions above cover the only valid entry points
  return NextResponse.redirect(new URL('/login?error=unexpected', origin));
}