import { sql } from "@/lib/db";
import { fetchWeather } from "@/lib/weatherkit";
import { sendPush } from "@/lib/push";

interface SubscriptionRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  lat: number;
  lon: number;
  country_code: string;
  timezone: string;
  notified_alert_ids: string[];
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const subscriptions = (await sql`
    SELECT id, endpoint, p256dh, auth, lat, lon, country_code, timezone, notified_alert_ids
    FROM push_subscriptions
  `) as unknown as SubscriptionRow[];

  let sent = 0;
  let removed = 0;

  for (const subscription of subscriptions) {
    let alerts;
    try {
      ({ alerts } = await fetchWeather(
        subscription.lat,
        subscription.lon,
        subscription.country_code,
        subscription.timezone,
      ));
    } catch {
      continue;
    }

    const alreadyNotified = new Set(subscription.notified_alert_ids);
    const newAlerts = alerts.filter((a) => !alreadyNotified.has(a.id));
    if (newAlerts.length === 0) continue;

    let gone = false;
    for (const alert of newAlerts) {
      const delivered = await sendPush(subscription, {
        title: `${alert.severity} weather alert`,
        body: alert.description,
      });

      if (!delivered) {
        await sql`DELETE FROM push_subscriptions WHERE id = ${subscription.id}`;
        removed++;
        gone = true;
        break;
      }

      sent++;
    }

    if (!gone) {
      await sql`
        UPDATE push_subscriptions
        SET notified_alert_ids = array_cat(notified_alert_ids, ${newAlerts.map((a) => a.id)})
        WHERE id = ${subscription.id}
      `;
    }
  }

  return Response.json({ checked: subscriptions.length, sent, removed });
}
