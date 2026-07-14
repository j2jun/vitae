import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  const { id } = await params;
  await sql`DELETE FROM stock_watchlist WHERE id = ${id} AND user_id = ${userId}`;
  return Response.json({ ok: true });
}
