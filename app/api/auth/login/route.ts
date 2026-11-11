import { NextResponse } from 'next/server';
import { checkPortalPassword, createSession } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!username || !password) {
    return NextResponse.json({ error: 'Please enter your username and password.' }, { status: 400 });
  }

  if (!checkPortalPassword(username, password)) {
    return NextResponse.json({ error: 'We could not sign you in. Please check your details.' }, { status: 401 });
  }

  await createSession(username);
  return NextResponse.json({ ok: true });
}
