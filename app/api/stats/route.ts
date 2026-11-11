import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const url =
    process.env.HILTON_COUNT_URL ||
    'https://flows.2kvoiceai.com/webhook/hilton-guest-stays/count';

  try {
    const res = await fetch(url, { cache: 'no-store', next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ error: 'Count is temporarily unavailable.' }, { status: 502 });
    }
    const data = await res.json();
    const count = typeof data.count === 'number' ? data.count : Number(data.count);
    if (!Number.isFinite(count)) {
      return NextResponse.json({ error: 'Count is temporarily unavailable.' }, { status: 502 });
    }
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: 'Count is temporarily unavailable.' }, { status: 502 });
  }
}
