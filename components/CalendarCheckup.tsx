"use client";

import { useEffect, useState } from "react";

interface CalendarEvent {
  uid: string;
  summary: string;
  location?: string;
  start: string;
  end: string;
  isFullDay: boolean;
}

interface CalendarResponse {
  feedUrl: string | null;
  events: CalendarEvent[];
  error?: string;
}

export default function CalendarCheckup() {
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [feedUrlInput, setFeedUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((res: CalendarResponse) => {
        if (res.error) setError(res.error);
        else setData(res);
      });
  }

  useEffect(load, []);

  async function saveFeedUrl(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedUrl: feedUrlInput }),
    });
    if (!res.ok) {
      setError("Couldn't save that feed URL.");
      return;
    }
    setFeedUrlInput("");
    load();
  }

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading calendar…</p>;

  if (!data.feedUrl) {
    return (
      <form onSubmit={saveFeedUrl}>
        <label>
          Calendar feed URL (Google/Apple/Outlook ICS export):{" "}
          <input
            type="url"
            required
            value={feedUrlInput}
            onChange={(e) => setFeedUrlInput(e.target.value)}
          />
        </label>
        <button type="submit">Save</button>
      </form>
    );
  }

  return (
    <div>
      {data.events.length === 0 && <p>No upcoming events in the next 14 days.</p>}
      <ul>
        {data.events.map((event) => (
          <li key={`${event.uid}-${event.start}`}>
            {event.isFullDay
              ? new Date(event.start).toLocaleDateString()
              : new Date(event.start).toLocaleString()}
            {" — "}
            {event.summary}
            {event.location && ` (${event.location})`}
          </li>
        ))}
      </ul>
    </div>
  );
}
