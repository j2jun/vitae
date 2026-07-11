"use client";

import { useEffect, useState } from "react";

interface WeatherAlert {
  id: string;
  severity: string;
  description: string;
  effectiveTime: string;
  expireTime: string;
  source: string;
}

interface CurrentWeather {
  temperature: number;
  conditionCode: string;
}

interface WeatherResponse {
  city?: string;
  countryCode?: string;
  current: CurrentWeather;
  alerts: WeatherAlert[];
  error?: string;
}

const SEEN_ALERTS_KEY = "vitae:seen-weather-alerts";

function getSeenAlertIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_ALERTS_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function markAlertsSeen(ids: string[]) {
  const seen = getSeenAlertIds();
  ids.forEach((id) => seen.add(id));
  localStorage.setItem(SEEN_ALERTS_KEY, JSON.stringify([...seen]));
}

export default function WeatherCheckup() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [newAlerts, setNewAlerts] = useState<WeatherAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const params = new URLSearchParams({
          lat: String(latitude),
          lon: String(longitude),
          timezone,
        });

        const res = await fetch(`/api/weather?${params}`);
        const data = (await res.json()) as WeatherResponse;

        if (!res.ok) {
          setError(data.error ?? "Couldn't load weather.");
          return;
        }

        setWeather(data);
        const seen = getSeenAlertIds();
        setNewAlerts(data.alerts.filter((a) => !seen.has(a.id)));
      },
      () => setError("Location permission denied."),
    );
  }, []);

  function dismissAlerts() {
    markAlertsSeen(newAlerts.map((a) => a.id));
    setNewAlerts([]);
  }

  if (error) return <p>{error}</p>;
  if (!weather) return <p>Loading weather…</p>;

  return (
    <div>
      {newAlerts.length > 0 && (
        <div role="alert">
          {newAlerts.map((a) => (
            <p key={a.id}>
              <strong>{a.severity}</strong> ({a.source}): {a.description}
            </p>
          ))}
          <button onClick={dismissAlerts}>Dismiss</button>
        </div>
      )}
      <p>
        {weather.city ?? "Your location"}: {weather.current?.temperature}°
      </p>
    </div>
  );
}
