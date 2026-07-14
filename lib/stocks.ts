export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error("FINNHUB_API_KEY is not set");

  const url = new URL("https://finnhub.io/api/v1/quote");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("token", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub quote request failed: ${res.status}`);
  }

  const data = await res.json();
  // Finnhub returns all-zero fields for a symbol it doesn't recognize.
  if (data.c === 0 && data.pc === 0) {
    throw new Error(`no quote found for "${symbol}"`);
  }

  return {
    symbol,
    price: data.c,
    change: data.d,
    changePercent: data.dp,
  };
}
