// Plain-text briefing built from the checkup data, no LLM. Used when no
// ANTHROPIC_API_KEY is set, or when the Claude call fails.

import type { WeatherData } from "@/lib/weather";
import type { CalendarEvent } from "@/lib/ical";
import type { Quote } from "@/lib/stocks";
import type { NewsItem } from "@/lib/rss";

export interface BriefingInput {
  time: { iso: string; timezone: string };
  weather?: Partial<WeatherData> & {
    daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_probability_max?: number[] };
  };
  calendar?: { events?: CalendarEvent[] };
  todos?: { todos?: { text: string; done: boolean }[] };
  news?: { items?: NewsItem[] };
  traffic?: { commute?: { destLabel: string } | null; eta?: { travelTimeSeconds: number; delaySeconds: number } | null };
  stocks?: { quotes?: Quote[] };
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function templateBriefing(d: BriefingInput): string {
  const parts: string[] = [];
  const now = new Date(d.time.iso);

  const w = d.weather;
  if (w?.current) {
    let s = `${Math.round(w.current.temperature)}°C and ${w.current.conditionCode.toLowerCase()}`;
    const hi = w.daily?.temperature_2m_max?.[0];
    const lo = w.daily?.temperature_2m_min?.[0];
    const rain = w.daily?.precipitation_probability_max?.[0];
    if (hi !== undefined && lo !== undefined) s += `, ${Math.round(lo)}–${Math.round(hi)}°C today`;
    if (rain !== undefined && rain >= 40) s += ` with a ${rain}% chance of rain`;
    parts.push(s + ".");
  }
  for (const a of w?.alerts ?? []) parts.push(`Alert: ${a.description}.`);

  const dayEnd = now.getTime() + 24 * 3600 * 1000;
  const upcoming = (d.calendar?.events ?? []).filter((e) => {
    const t = new Date(e.start).getTime();
    return t >= now.getTime() - 3600 * 1000 && t <= dayEnd;
  });
  if (upcoming.length) {
    const next = upcoming[0];
    const at = next.isFullDay
      ? "all day"
      : `at ${new Date(next.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: d.time.timezone })}`;
    parts.push(`${plural(upcoming.length, "event")} in the next 24 hours, starting with ${next.summary} ${at}.`);
  }

  const open = (d.todos?.todos ?? []).filter((t) => !t.done);
  if (open.length) parts.push(`${plural(open.length, "open to-do")}, next up: ${open[0].text}.`);

  const eta = d.traffic?.eta;
  if (d.traffic?.commute && eta) {
    const mins = Math.round(eta.travelTimeSeconds / 60);
    const delay = Math.round(eta.delaySeconds / 60);
    parts.push(`Commute to ${d.traffic.commute.destLabel}: ${mins} min${delay >= 2 ? ` (+${delay} from traffic)` : ""}.`);
  }

  const quotes = d.stocks?.quotes ?? [];
  if (quotes.length) {
    const biggest = quotes.reduce((a, b) => (Math.abs(b.changePercent) > Math.abs(a.changePercent) ? b : a));
    const sign = biggest.changePercent >= 0 ? "+" : "";
    parts.push(`Biggest mover on your watchlist: ${biggest.symbol} ${sign}${biggest.changePercent.toFixed(1)}%.`);
  }

  const headline = d.news?.items?.[0];
  if (headline) parts.push(`Top headline: ${headline.title}.`);

  return parts.join(" ") || "Nothing to report yet. Add a module below to get a briefing.";
}

// Self-check: npx tsx lib/briefing.ts
if (process.argv[1]?.endsWith("briefing.ts")) {
  const out = templateBriefing({
    time: { iso: "2026-11-08T16:00:00Z", timezone: "America/Los_Angeles" },
    weather: {
      current: { temperature: 8.3, conditionCode: "Cloudy" },
      daily: { temperature_2m_max: [13.8], temperature_2m_min: [8.1], precipitation_probability_max: [50] },
      alerts: [],
    },
    calendar: { events: [{ uid: "1", summary: "Standup", start: "2026-11-08T17:30:00Z", isFullDay: false }] },
    todos: { todos: [{ text: "Pay rent", done: false }, { text: "Old", done: true }] },
    traffic: { commute: { destLabel: "Work" }, eta: { travelTimeSeconds: 1800, delaySeconds: 420 } },
    stocks: { quotes: [{ symbol: "AAPL", price: 1, change: 0, changePercent: 0.4 }, { symbol: "NVDA", price: 1, change: 0, changePercent: -2.25 }] },
  });
  console.log(out);
  for (const want of ["8°C and cloudy", "8–14°C", "50% chance", "Standup at 9:30 AM", "1 open to-do, next up: Pay rent", "30 min (+7", "NVDA -2.3%"]) {
    if (!out.includes(want)) throw new Error(`missing: ${want}`);
  }
  if (templateBriefing({ time: { iso: "2026-11-08T16:00:00Z", timezone: "UTC" } }).indexOf("Nothing to report") !== 0) throw new Error("empty case");
  console.log("ok");
}
