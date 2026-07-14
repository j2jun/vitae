"use client";

import { useEffect, useState } from "react";

interface Quote {
  id: number;
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
  error?: string;
}

export default function StockWatchlist() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [symbol, setSymbol] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/stocks")
      .then((res) => res.json())
      .then((res) => (res.error ? setError(res.error) : setQuotes(res.quotes)));
  }

  useEffect(load, []);

  async function addSymbol(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol.trim()) return;
    const res = await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    if (!res.ok) {
      setError("Couldn't add that symbol.");
      return;
    }
    setSymbol("");
    load();
  }

  async function removeSymbol(id: number) {
    setQuotes((prev) => prev?.filter((q) => q.id !== id) ?? null);
    await fetch(`/api/stocks/${id}`, { method: "DELETE" });
  }

  if (error) return <p>{error}</p>;
  if (!quotes) return <p>Loading watchlist…</p>;

  return (
    <div>
      <form onSubmit={addSymbol}>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Add a ticker (e.g. AAPL)"
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {quotes.map((q) => (
          <li key={q.id}>
            {q.symbol}{" "}
            {q.error
              ? q.error
              : `${q.price} (${(q.change ?? 0) >= 0 ? "+" : ""}${q.change} / ${(q.changePercent ?? 0) >= 0 ? "+" : ""}${q.changePercent}%)`}
            <button onClick={() => removeSymbol(q.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
