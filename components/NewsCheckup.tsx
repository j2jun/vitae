"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  title: string;
  link: string;
  publishedAt?: string;
}

interface NewsResponse {
  feedUrl: string | null;
  items: NewsItem[];
  error?: string;
}

export default function NewsCheckup() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [feedUrlInput, setFeedUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/news")
      .then((res) => res.json())
      .then((res: NewsResponse) => {
        if (res.error) setError(res.error);
        else setData(res);
      });
  }

  useEffect(load, []);

  async function saveFeedUrl(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/news", {
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
  if (!data) return <p>Loading news…</p>;

  if (!data.feedUrl) {
    return (
      <form onSubmit={saveFeedUrl}>
        <label>
          News feed URL (any RSS/Atom feed):{" "}
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
      {data.items.length === 0 && <p>No headlines found.</p>}
      <ul>
        {data.items.map((item) => (
          <li key={item.link}>
            <a href={item.link} target="_blank" rel="noreferrer">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
