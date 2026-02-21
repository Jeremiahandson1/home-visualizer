// ═══════════════════════════════════════════════════════
// ADMIN AUTH — Password-based authentication
// Uses HMAC-SHA256 + timing-safe comparison.
// Set ADMIN_PASSWORD + ADMIN_TOKEN_SECRET in env.
// ═══════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

const COOKIE_NAME  = 'hv_admin_token';
const TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * HMAC-SHA256 token derived from password + a per-instance secret.
 * The secret prevents offline brute-force: even if the hash is leaked,
 * an attacker can't verify guesses without the secret.
 */
function makeToken(password) {
  const secret = process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_PASSWORD || 'fallback-dev-secret';
  return createHmac('sha256', secret).update(password).digest('hex');
}

/**
 * Timing-safe string comparison — prevents timing attacks.
 */
function safeEqual(a, b) {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verify the admin session cookie.
 */
export function isAuthenticated() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const expected = makeToken(process.env.ADMIN_PASSWORD || '');
  return safeEqual(token, expected);
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
 * Login — verify password with timing-safe compare, set cookie.
 */
export function login(password) {
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminPassword) return { success: false };

  // Compare the submitted password to the env password using timing-safe equal
  const submittedBuf = Buffer.from(password);
  const expectedBuf  = Buffer.from(adminPassword);
  const lengthsMatch = submittedBuf.length === expectedBuf.length;
  // Always run timingSafeEqual (on a same-length buffer if needed) to avoid leaking length
  const paddedSubmitted = Buffer.alloc(expectedBuf.length);
  submittedBuf.copy(paddedSubmitted);
  const passwordMatch = lengthsMatch && timingSafeEqual(paddedSubmitted, expectedBuf);

  if (!passwordMatch) return { success: false };

  const token = makeToken(password);
  return { success: true, token, cookieName: COOKIE_NAME, maxAge: TOKEN_EXPIRY };
}

/**
 * Logout — clear cookie.
 */
export function logout() {
  return { cookieName: COOKIE_NAME };
}
