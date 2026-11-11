import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { workmateEnvStatus } from '@/lib/workmate';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const workmate = workmateEnvStatus();
  return NextResponse.json({
    canSendGuests: workmate.ready,
    countAvailable: true,
  });
}
