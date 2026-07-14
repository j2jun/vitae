"use client";

import { useEffect, useState } from "react";

interface CommuteEta {
  travelTimeSeconds: number;
  delaySeconds: number;
}

interface TrafficResponse {
  commute: { originLabel: string; destLabel: string } | null;
  eta: CommuteEta | null;
  error?: string;
}

function minutes(seconds: number): number {
  return Math.round(seconds / 60);
}

export default function TrafficCheckup() {
  const [data, setData] = useState<TrafficResponse | null>(null);
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/traffic")
      .then((res) => res.json())
      .then((res: TrafficResponse) => {
        if (res.error) setError(res.error);
        else setData(res);
      });
  }

  useEffect(load, []);

  async function saveCommute(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originQuery, destQuery }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Couldn't save that commute.");
      return;
    }
    setOriginQuery("");
    setDestQuery("");
    load();
  }

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading traffic…</p>;

  if (!data.commute) {
    return (
      <form onSubmit={saveCommute}>
        <label>
          From: <input required value={originQuery} onChange={(e) => setOriginQuery(e.target.value)} />
        </label>
        <label>
          To: <input required value={destQuery} onChange={(e) => setDestQuery(e.target.value)} />
        </label>
        <button type="submit">Save commute</button>
      </form>
    );
  }

  return (
    <p>
      {data.commute.originLabel} → {data.commute.destLabel}:{" "}
      {data.eta && (
        <>
          {minutes(data.eta.travelTimeSeconds)} min
          {data.eta.delaySeconds > 60 && ` (+${minutes(data.eta.delaySeconds)} min due to traffic)`}
        </>
      )}
    </p>
  );
}
