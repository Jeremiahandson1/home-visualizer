import { NextResponse } from 'next/server';
import { login, logout, isAuthenticated } from '@/lib/admin-auth';

// POST /api/admin/auth — login
export async function POST(request) {
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
