import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE = 'hilton_portal_session';

function secret() {
  const s = process.env.SESSION_SECRET || 'dev-only-change-in-production';
  return new TextEncoder().encode(s);
}

async function cookieStore() {
  return cookies();
}

export async function createSession(username: string) {
  const token = await new SignJWT({ sub: username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());

  const jar = await cookieStore();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookieStore();
  jar.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getSessionUser(): Promise<string | null> {
  const jar = await cookieStore();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export function checkPortalPassword(username: string, password: string): boolean {
  const u = process.env.HILTON_PORTAL_USER;
  const p = process.env.HILTON_PORTAL_PASSWORD;
  if (!u || !p) {
    if (process.env.NODE_ENV === 'development') {
      return username === 'hilton' && password === 'HiltonWelcome2026';
    }
    return false;
  }
  return username === u && password === p;
}
