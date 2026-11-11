# Deploy on Vercel (from GitHub)

1. Open [Import `hilton-guest-portal`](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsandeep-1992%2Fhilton-guest-portal&project-name=hilton-guest-portal).
2. Add **Environment Variables** (Production):

| Name | Value |
|------|--------|
| `HILTON_PORTAL_USER` | `hilton` |
| `HILTON_PORTAL_PASSWORD` | *(pick a strong client password)* |
| `SESSION_SECRET` | *(long random string)* |
| `HILTON_COUNT_URL` | `https://flows.2kvoiceai.com/webhook/hilton-guest-stays/count` |
| `WORKMATE_API_URL` | `https://workmate.2kvoiceai.com` |
| `WORKMATE_API_KEY` | *(from workmate config)* |
| `WORKMATE_BASIC_AUTH_USER` | `workmate` |
| `WORKMATE_BASIC_AUTH_PASSWORD` | *(from workmate config — `WORKMATE_BASIC_AUTH_PASS` in file)* |

**Required for “Send to front desk”:** `WORKMATE_API_URL` + `WORKMATE_API_KEY`. Without these, the count still works but uploads will not send.

3. Deploy. Sign-in URL: `https://<your-vercel-domain>/login`

`Send to front desk` needs the Workmate variables. **Guests on file** only needs `HILTON_COUNT_URL`.
