# vitae

AI daily-checkup platform — auto-detects location and time, then surfaces weather, news, stocks, traffic, health, calendar, and to-dos in one live-updating dashboard. Desktop web first (PWA), with a path to Android/iOS via Capacitor.

## Stack

- Next.js (App Router) + TypeScript + React — one codebase for frontend and API routes
- Anthropic API (`@anthropic-ai/sdk`) for the AI-generated daily briefing
- Apple WeatherKit for current conditions, forecast, and severe weather alerts
- OpenStreetMap Nominatim for reverse geocoding (lat/lon → country code, for WeatherKit's alert scoping)
- Clerk for auth
- Postgres (`postgres` client, no ORM yet — one table so far) for per-user data
- Web Push (VAPID, browser-native — no third-party push vendor) for alert notifications
- `node-ical` for reading the user's calendar feed, including recurring-event (RRULE) expansion

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

`ANTHROPIC_API_KEY` — from the Anthropic Console.

`APPLE_WEATHERKIT_*` — requires an Apple Developer Program membership:
1. Register a Services ID with the WeatherKit capability enabled.
2. Create a WeatherKit key and download its `.p8` private key.
3. Fill in `APPLE_WEATHERKIT_TEAM_ID`, `APPLE_WEATHERKIT_SERVICE_ID`, `APPLE_WEATHERKIT_KEY_ID`, and paste the `.p8` contents into `APPLE_WEATHERKIT_PRIVATE_KEY`.

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — sign up at clerk.com and copy from an application's API Keys page. Not required for local dev: Clerk runs in "keyless mode" without them and prints a one-click link in the terminal to claim real keys when you're ready.

`DATABASE_URL` — any Postgres works; Neon (neon.tech) has a no-server-management free tier. Once set, run `db/schema.sql` against it (e.g. `psql $DATABASE_URL -f db/schema.sql`).

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generate your own with `npx web-push generate-vapid-keys`, no external account needed. Also set `VAPID_SUBJECT` to a `mailto:` address.

`CRON_SECRET` — any random string. Vercel Cron automatically sends it as `Authorization: Bearer <value>` to `/api/cron/check-alerts` on the schedule in `vercel.json`; on another host, point your own scheduler at that route with the same header.

## Endpoints

| Route | Status | Notes |
|---|---|---|
| `POST /api/briefing` | done | Turns fetched module data (weather, news, stocks, etc.) into a short natural-language summary via Claude. |
| `GET /api/weather` | done | `?lat=&lon=&timezone=` → current conditions, forecast, and active severe weather alerts (heat, storm, winter/ice, tornado/hurricane, fire) via WeatherKit. |
| `POST /api/push/subscribe` | done | Saves a browser's push subscription + location, signed-in only. `DELETE` removes it. |
| `GET /api/cron/check-alerts` | done | Cron-only (checked via `CRON_SECRET`). Re-checks every saved location and pushes any alert it hasn't sent before; drops subscriptions the push service reports as gone. |
| `GET /api/calendar` | done | Signed-in only. Fetches the user's saved ICS feed URL, returns events (recurring events expanded) in the next 14 days. |
| `POST /api/calendar` | done | Saves/updates the user's ICS feed URL (Google/Apple/Outlook calendar export), signed-in only. `DELETE` removes it. |
| `GET /api/todos` | done | Lists the signed-in user's to-dos. `POST` adds one. |
| `PATCH /api/todos/[id]` | done | Updates `text` and/or `done` on a to-do, scoped to the signed-in user. `DELETE` removes it. |
| `/api/news` | planned | |
| `/api/stocks` | planned | |
| `/api/traffic` | planned | |

## Notes

- Location + local time are read client-side via the browser Geolocation API and `Intl.DateTimeFormat` — no IP-geolocation service needed unless permission is denied.
- Weather alerts now have two independent channels: an in-app banner (`components/WeatherCheckup.tsx`, dedup via `localStorage`) and real push (`components/PushSubscribe.tsx` + `public/sw.js`, dedup via the `notified_alert_ids` column). Each tracks "already seen" separately — fine for v1, no need to unify them.
- Auth is Clerk (`proxy.ts` + `<ClerkProvider>` in `app/layout.tsx`). `auth()` from `@clerk/nextjs/server` gives a `userId` that per-user tables key on directly — no separate `users` table.
- Three tables so far (`push_subscriptions`, `calendar_feeds`, `todos`, in `db/schema.sql`). Plain `postgres` client, no ORM — add one if the schema grows past a few simple tables.
