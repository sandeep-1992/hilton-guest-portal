# Hilton guest stay portal

Client-facing portal: sign-in, live guest count, spreadsheet upload, and submission to front desk processing.

## Vercel environment variables

| Variable | Purpose |
|----------|---------|
| `HILTON_PORTAL_USER` | Sign-in username |
| `HILTON_PORTAL_PASSWORD` | Sign-in password |
| `SESSION_SECRET` | Random string for session cookies |
| `HILTON_COUNT_URL` | Defaults to `https://flows.2kvoiceai.com/webhook/hilton-guest-stays/count` |
| `WORKMATE_API_URL` | e.g. `https://workmate.2kvoiceai.com` |
| `WORKMATE_API_KEY` | Workmate key (server-side only) |
| `WORKMATE_BASIC_AUTH_USER` / `WORKMATE_BASIC_AUTH_PASSWORD` | If HTTPS basic auth is enabled |

## Local dev

```bash
npm install
cp .env.example .env.local
npm run dev
```
