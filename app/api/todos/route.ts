import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  try {
    const todos = await sql`
      SELECT id, text, done FROM todos WHERE user_id = ${userId} ORDER BY created_at
    `;
    return Response.json({ todos });
  } catch {
    return Response.json({ error: "to-do lookup failed" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  const { text } = (await req.json()) ?? {};
  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const [todo] = await sql`
      INSERT INTO todos (user_id, text) VALUES (${userId}, ${text.trim()})
      RETURNING id, text, done
    `;
    return Response.json({ todo });
  } catch {
    return Response.json({ error: "couldn't add that to-do" }, { status: 502 });
  }
}
