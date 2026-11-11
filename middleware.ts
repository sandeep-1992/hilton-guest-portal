import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = 'hilton_portal_session';

async function isAuthed(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET || 'dev-only-change-in-production',
    );
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await isAuthed(req);

  if (pathname.startsWith('/dashboard') && !authed) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname === '/login' && authed) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  if (pathname === '/' && authed) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  if (pathname === '/' && !authed) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};
