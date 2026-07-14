import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const { text, done } = (await req.json()) ?? {};
  if (text === undefined && done === undefined) {
    return Response.json({ error: "text or done is required" }, { status: 400 });
  }

  try {
    const [todo] = await sql`
      UPDATE todos SET
        text = COALESCE(${text ?? null}, text),
        done = COALESCE(${done ?? null}, done)
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, text, done
    `;

    if (!todo) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    return Response.json({ todo });
  } catch {
    return Response.json({ error: "couldn't update that to-do" }, { status: 502 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await sql`DELETE FROM todos WHERE id = ${id} AND user_id = ${userId}`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "couldn't delete that to-do" }, { status: 502 });
  }
}
