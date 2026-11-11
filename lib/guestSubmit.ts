import type { GuestRow } from './parseGuests';
import { submitGuestsToWorkmate } from './workmate';

const DEFAULT_WEBHOOK =
  'https://flows.2kvoiceai.com/webhook/hilton-guest-stays/submit';

export function guestSubmitEnvStatus(): { ready: boolean; mode: 'workmate' | 'webhook' | 'none' } {
  const webhook = process.env.HILTON_SUBMIT_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK;
  const workmateKey = process.env.WORKMATE_API_KEY?.trim();
  const workmateUrl = process.env.WORKMATE_API_URL?.trim();
  if (workmateUrl && workmateKey) return { ready: true, mode: 'workmate' };
  if (webhook) return { ready: true, mode: 'webhook' };
  return { ready: false, mode: 'none' };
}

export async function submitGuestViaWebhook(row: GuestRow) {
  const url = process.env.HILTON_SUBMIT_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
    cache: 'no-store',
  });
  const text = await res.text().catch(() => '');
  let data: { ok?: boolean; message?: string } = {};
  try {
    data = JSON.parse(text);
  } catch {
    /* plain text response */
  }
  if (!res.ok) {
    throw new Error(data.message || text || 'Could not save this guest.');
  }
  if (data.ok === false) {
    throw new Error(data.message || 'Could not save this guest.');
  }
  return { ok: true as const };
}

/** Prefer Workmate (Playwright); fall back to n8n webhook when VPS route is outdated (404). */
export async function submitOneGuest(row: GuestRow) {
  const preferWebhook = process.env.HILTON_SUBMIT_MODE === 'webhook';
  const webhookUrl = process.env.HILTON_SUBMIT_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK;

  if (preferWebhook) {
    await submitGuestViaWebhook(row);
    return { via: 'webhook' as const };
  }

  const hasWorkmate =
    Boolean(process.env.WORKMATE_API_URL?.trim()) && Boolean(process.env.WORKMATE_API_KEY?.trim());

  if (hasWorkmate) {
    try {
      const batch = await submitGuestsToWorkmate([row]);
      const r = batch.results?.[0];
      if (r?.ok) return { via: 'workmate' as const };
      if (r?.error) throw new Error(r.error);
      if (!batch.ok) throw new Error('Could not save this guest.');
      return { via: 'workmate' as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== 'not_found' && !msg.includes('not_found')) throw e;
    }
  }

  await submitGuestViaWebhook(row);
  return { via: 'webhook' as const };
}
