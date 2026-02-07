// ═══════════════════════════════════════════════════════
// ADMIN AUTH — Simple password-based authentication
// Set ADMIN_PASSWORD in env. Upgrade to Supabase Auth later.
// ═══════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'hv_admin_token';
const TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Generate a simple hash token from the password.
 * Not cryptographically perfect, but fine for a single-user admin panel.
 */
function hashToken(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(`hv_admin_${password}_salt`).digest('hex');
}

/**
 * Verify the admin session cookie.
 * Returns true if authenticated.
 */
export function isAuthenticated() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const expected = hashToken(process.env.ADMIN_PASSWORD || '');
  return token === expected;
}

/**
 * Middleware for API routes — returns 401 if not authenticated.
 */
export function requireAuth() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null; // authenticated
}

/**
 * Login — verify password, set cookie.
 */
export function login(password) {
  if (password !== process.env.ADMIN_PASSWORD) {
    return { success: false };
  }

  const token = hashToken(password);
  return { success: true, token, cookieName: COOKIE_NAME, maxAge: TOKEN_EXPIRY };
}

/**
 * Logout — clear cookie.
 */
export function logout() {
  return { cookieName: COOKIE_NAME };
}
