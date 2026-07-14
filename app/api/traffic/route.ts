import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { forwardGeocode } from "@/lib/geocode";
import { fetchCommuteEta } from "@/lib/traffic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  try {
    const [commute] = await sql`
      SELECT origin_label, origin_lat, origin_lon, dest_label, dest_lat, dest_lon
      FROM commutes WHERE user_id = ${userId}
    `;

    if (!commute) {
      return Response.json({ commute: null, eta: null });
    }

    const eta = await fetchCommuteEta(
      commute.origin_lat,
      commute.origin_lon,
      commute.dest_lat,
      commute.dest_lon,
    );
    return Response.json({
      commute: { originLabel: commute.origin_label, destLabel: commute.dest_label },
      eta,
    });
  } catch {
    return Response.json({ error: "traffic lookup failed" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  const { originQuery, destQuery } = (await req.json()) ?? {};
  if (typeof originQuery !== "string" || !originQuery.trim() ||
      typeof destQuery !== "string" || !destQuery.trim()) {
    return Response.json({ error: "originQuery and destQuery are required" }, { status: 400 });
  }

  let origin, dest;
  try {
    [origin, dest] = await Promise.all([
      forwardGeocode(originQuery),
      forwardGeocode(destQuery),
    ]);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "geocoding failed" },
      { status: 400 },
    );
  }

  try {
    await sql`
      INSERT INTO commutes (user_id, origin_label, origin_lat, origin_lon, dest_label, dest_lat, dest_lon)
      VALUES (${userId}, ${originQuery}, ${origin.lat}, ${origin.lon}, ${destQuery}, ${dest.lat}, ${dest.lon})
      ON CONFLICT (user_id) DO UPDATE SET
        origin_label = EXCLUDED.origin_label,
        origin_lat = EXCLUDED.origin_lat,
        origin_lon = EXCLUDED.origin_lon,
        dest_label = EXCLUDED.dest_label,
        dest_lat = EXCLUDED.dest_lat,
        dest_lon = EXCLUDED.dest_lon
    `;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "couldn't save that commute" }, { status: 502 });
  }
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  try {
    await sql`DELETE FROM commutes WHERE user_id = ${userId}`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "couldn't remove that commute" }, { status: 502 });
  }
}
