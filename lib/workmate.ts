import type { GuestRow } from './parseGuests';

export async function submitGuestsToWorkmate(rows: GuestRow[]) {
  const base = process.env.WORKMATE_API_URL?.replace(/\/$/, '');
  const key = process.env.WORKMATE_API_KEY;
  const user = process.env.WORKMATE_BASIC_AUTH_USER;
  const pass = process.env.WORKMATE_BASIC_AUTH_PASSWORD;

  if (!base || !key) {
    throw new Error('Guest processing is not configured yet. Please contact your administrator.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Workmate-Key': key,
  };
  if (user && pass) {
    headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  }

  const res = await fetch(`${base}/v1/hilton-guest/batch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ rows, headed: false, screenshots: false }),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data.message === 'string'
        ? data.message
        : typeof data.error === 'string'
          ? data.error
          : 'Could not complete the request.';
    throw new Error(msg);
  }
  return data as {
    ok: boolean;
    submitted: number;
    failed: number;
    total: number;
    results: Array<{ code: string; guestName: string; ok: boolean; error?: string }>;
  };
}
