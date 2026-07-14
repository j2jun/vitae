import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { fetchQuote } from "@/lib/stocks";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  try {
    const watchlist = await sql`
      SELECT id, symbol FROM stock_watchlist WHERE user_id = ${userId} ORDER BY created_at
    `;

    const quotes = await Promise.all(
      watchlist.map(async (row) => {
        try {
          return { id: row.id, ...(await fetchQuote(row.symbol)) };
        } catch {
          return { id: row.id, symbol: row.symbol, error: "quote lookup failed" };
        }
      }),
    );

    return Response.json({ quotes });
  } catch {
    return Response.json({ error: "watchlist lookup failed" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "sign in required" }, { status: 401 });
  }

  const { symbol } = (await req.json()) ?? {};
  if (typeof symbol !== "string" || !symbol.trim()) {
    return Response.json({ error: "symbol is required" }, { status: 400 });
  }

  try {
    const [row] = await sql`
      INSERT INTO stock_watchlist (user_id, symbol)
      VALUES (${userId}, ${symbol.trim().toUpperCase()})
      ON CONFLICT (user_id, symbol) DO NOTHING
      RETURNING id, symbol
    `;
    return Response.json({ watchlistItem: row ?? null });
  } catch {
    return Response.json({ error: "couldn't add that symbol" }, { status: 502 });
  }
}
