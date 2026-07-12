# vitae

AI daily-checkup platform — auto-detects location and time, then surfaces weather, news, stocks, traffic, health, calendar, and to-dos in one live-updating dashboard. Desktop web first (PWA), with a path to Android/iOS via Capacitor.

## Stack

- Next.js (App Router) + TypeScript + React — one codebase for frontend and API routes
- Anthropic API (`@anthropic-ai/sdk`) for the AI-generated daily briefing
- Apple WeatherKit for current conditions, forecast, and severe weather alerts
- OpenStreetMap Nominatim for reverse geocoding (lat/lon → country code, for WeatherKit's alert scoping)
- Clerk for auth

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

## Endpoints

| Route | Status | Notes |
|---|---|---|
| `POST /api/briefing` | done | Turns fetched module data (weather, news, stocks, etc.) into a short natural-language summary via Claude. |
| `GET /api/weather` | done | `?lat=&lon=&timezone=` → current conditions, forecast, and active severe weather alerts (heat, storm, winter/ice, tornado/hurricane, fire) via WeatherKit. |
| `/api/news` | planned | |
| `/api/stocks` | planned | |
| `/api/traffic` | planned | |
| `/api/calendar` | planned | Reads an ICS feed URL (Google/Apple/Outlook calendar export). Needs a per-user place to save the feed URL. |
| `/api/todos` | planned | CRUD against the user's to-do list. Needs a database (not set up yet — Clerk handles identity, not app data). |

## Notes

- Location + local time are read client-side via the browser Geolocation API and `Intl.DateTimeFormat` — no IP-geolocation service needed unless permission is denied.
- Weather alert notifications are in-app only for now (`components/WeatherCheckup.tsx` diffs alerts against ones already seen, stored in `localStorage`). Real push notifications (while the app isn't open) are next now that accounts exist — need a `push_subscriptions` table + a service worker, which will land with that module rather than being scaffolded early.
- Auth is Clerk (`proxy.ts` + `<ClerkProvider>` in `app/layout.tsx`). No per-user database yet — `auth()` from `@clerk/nextjs/server` gives a `userId` that future modules (todos, calendar, push) can key their own tables on directly, no separate `users` table needed.
