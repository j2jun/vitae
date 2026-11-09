"use client";

import { useEffect, useState } from "react";

// Grabs a module's JSON, or undefined if it errors (signed out, not configured, upstream down).
async function tryJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : undefined;
  } catch {
    return undefined;
  }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition(resolve, reject)
      : reject(new Error("no geolocation")),
  );
}

export default function BriefingCheckup() {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let position: GeolocationPosition;
      try {
        position = await getPosition();
      } catch {
        setError("Location is needed for the briefing.");
        return;
      }
      const { latitude: lat, longitude: lon } = position.coords;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const weatherParams = new URLSearchParams({ lat: String(lat), lon: String(lon), timezone });

      // ponytail: re-fetches what the other cards already load; lift into shared state if API quotas bite.
      const [weather, calendar, todos, news, traffic, stocks] = await Promise.all([
        tryJson(`/api/weather?${weatherParams}`),
        tryJson("/api/calendar"),
        tryJson("/api/todos"),
        tryJson("/api/news"),
        tryJson("/api/traffic"),
        tryJson("/api/stocks"),
      ]);

      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: { city: (weather as { city?: string } | undefined)?.city, lat, lon },
          time: { iso: new Date().toISOString(), timezone },
          weather, calendar, todos, news, traffic, stocks,
        }),
      });
      const body = await res.json();
      if (!res.ok) setError(body.error ?? "Couldn't generate the briefing.");
      else setSummary(body.summary);
    })();
  }, []);

  if (error) return <p>{error}</p>;
  if (summary === null) return <p>Writing your briefing…</p>;
  return <p className="briefing">{summary}</p>;
}
