import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { fetchUpcomingEvents } from "@/lib/ical";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  const [feed] = await sql`
    SELECT feed_url FROM calendar_feeds WHERE user_id = ${userId}
  `;

  if (!feed) {
    return Response.json({ feedUrl: null, events: [] });
  }

  try {
    const events = await fetchUpcomingEvents(feed.feed_url);
    return Response.json({ feedUrl: feed.feed_url, events });
  } catch {
    return Response.json({ error: "calendar feed lookup failed" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  const { feedUrl } = (await req.json()) ?? {};
  if (typeof feedUrl !== "string" || !/^https?:\/\//.test(feedUrl)) {
    return Response.json({ error: "feedUrl must be an http(s) URL" }, { status: 400 });
  }

  await sql`
    INSERT INTO calendar_feeds (user_id, feed_url)
    VALUES (${userId}, ${feedUrl})
    ON CONFLICT (user_id) DO UPDATE SET feed_url = EXCLUDED.feed_url
  `;

  return Response.json({ ok: true });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  await sql`DELETE FROM calendar_feeds WHERE user_id = ${userId}`;
  return Response.json({ ok: true });
}
