import { auth } from "@clerk/nextjs/server";
import { reverseGeocode } from "@/lib/geocode";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  const body = await req.json();
  const { subscription, lat, lon, timezone } = body ?? {};

  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !timezone
  ) {
    return Response.json({ error: "invalid subscription payload" }, { status: 400 });
  }

  try {
    const { countryCode } = await reverseGeocode(lat, lon);

    await sql`
      INSERT INTO push_subscriptions
        (user_id, endpoint, p256dh, auth, lat, lon, country_code, timezone)
      VALUES
        (${userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth},
         ${lat}, ${lon}, ${countryCode}, ${timezone})
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        lat = EXCLUDED.lat,
        lon = EXCLUDED.lon,
        country_code = EXCLUDED.country_code,
        timezone = EXCLUDED.timezone,
        notified_alert_ids = '{}'
    `;

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "subscribe failed" }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  const { endpoint } = await req.json();
  if (!endpoint) {
    return Response.json({ error: "endpoint is required" }, { status: 400 });
  }

  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint} AND user_id = ${userId}`;
  return Response.json({ ok: true });
}
