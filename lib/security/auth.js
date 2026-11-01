import { createClient } from '../supabase/server';

/**
 * Resolve the current Supabase session on the server.
 * Never trust a user ID supplied by the browser.
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return { user: null };
    return { user: data.user };
  } catch {
    return { user: null };
  }
}

export function unauthorizedResponse(NextResponse) {
  return NextResponse.json(
    { error: 'লগইন করে AI ব্যবহার করুন। আপনার অ্যাকাউন্টে প্রবেশ করে আবার চেষ্টা করুন।', code: 'LOGIN_REQUIRED' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } },
  );
}
