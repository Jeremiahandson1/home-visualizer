import { NextResponse } from 'next/server';
import { login, logout, isAuthenticated } from '@/lib/admin-auth';

// Simple in-memory login rate limiter
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && now - entry.firstAttempt < LOGIN_WINDOW_MS) {
    if (entry.count >= MAX_LOGIN_ATTEMPTS) return true;
    entry.count++;
    return false;
  }
  loginAttempts.set(ip, { count: 1, firstAttempt: now });
  // Clean old entries
  for (const [key, val] of loginAttempts) {
    if (now - val.firstAttempt > LOGIN_WINDOW_MS) loginAttempts.delete(key);
  }
  return false;
}

// POST /api/admin/auth — login
export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (checkLoginRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
  }

  const { password } = await request.json();
  const result = login(password);

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(result.cookieName, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: result.maxAge,
    path: '/',
  });

  return response;
}

// GET /api/admin/auth — check if authenticated
export async function GET() {
  return NextResponse.json({ authenticated: isAuthenticated() });
}

// DELETE /api/admin/auth — logout
export async function DELETE() {
  const { cookieName } = logout();
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, '', { maxAge: 0, path: '/' });
  return response;
}
