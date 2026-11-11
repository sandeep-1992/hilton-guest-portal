import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { submitOneGuest } from '@/lib/guestSubmit';
import type { GuestRow } from '@/lib/parseGuests';

export const maxDuration = 300;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const row = body.row as GuestRow | undefined;
  if (!row?.guestName || !row?.code) {
    return NextResponse.json({ error: 'Missing guest details.' }, { status: 400 });
  }

  try {
    await submitOneGuest(row);
    return NextResponse.json({
      ok: true,
      code: row.code,
      guestName: row.guestName,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Something went wrong.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
