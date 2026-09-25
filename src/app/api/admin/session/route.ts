import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  clearFailedLogins,
  createSessionToken,
  getClientIp,
  loginRetryAfterSeconds,
  passwordMatches,
  recordFailedLogin,
  requireAdmin,
} from '@/lib/adminAuth';

// Does the browser currently hold a valid admin session?
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ authenticated: true });
}

// Sign in: exchange the admin password for an httpOnly session cookie.
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const retryAfter = loginRetryAfterSeconds(ip);
    if (retryAfter > 0) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }

    const { password } = await request.json().catch(() => ({ password: undefined }));

    if (!passwordMatches(password)) {
      recordFailedLogin(ip);
      // Small fixed delay makes rapid guessing on a single connection slower.
      await new Promise((resolve) => setTimeout(resolve, 400));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = createSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    clearFailedLogins(ip);
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch (error: unknown) {
    console.error('Error creating admin session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Sign out: clear the cookie.
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
