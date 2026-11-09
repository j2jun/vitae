// Forecast: Open-Meteo (free, no key). Alerts: US National Weather Service
// (free, no key). Temperatures are °C.

const USER_AGENT = "vitae-daily-checkup (github.com/j2jun/vitae)";

export interface WeatherAlert {
  id: string;
  severity: string;
  urgency: string;
  certainty: string;
  description: string;
  source: string;
  areaName: string;
  effectiveTime: string;
  expireTime: string;
  detailsUrl: string;
}

export interface WeatherData {
  current: { temperature: number; conditionCode: string };
  daily: unknown;
  hourly: unknown;
  alerts: WeatherAlert[];
}

// WMO weather interpretation codes, as returned by Open-Meteo.
const WMO: [number, string][] = [
  [0, "Clear"], [3, "Cloudy"], [48, "Fog"], [57, "Drizzle"], [67, "Rain"],
  [77, "Snow"], [82, "Rain showers"], [86, "Snow showers"], [99, "Thunderstorm"],
];

export function describeWeatherCode(code: number): string {
  return WMO.find(([max]) => code <= max)?.[1] ?? "Unknown";
}

async function fetchForecast(lat: number, lon: number, timezone: string) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("timezone", timezone);
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weather_code");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code");
  url.searchParams.set("forecast_days", "3");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`);
  return res.json();
}

interface NwsFeature {
  properties: {
    id: string;
    severity: string;
    urgency: string;
    certainty: string;
    headline: string | null;
    description: string;
    senderName: string;
    areaDesc: string;
    effective: string;
    expires: string;
    "@id": string;
  };
}

// ponytail: NWS covers the US only; other countries get no alerts until a
// per-country source (e.g. MeteoAlarm for Europe) is added.
async function fetchAlerts(lat: number, lon: number, countryCode: string): Promise<WeatherAlert[]> {
  if (countryCode !== "US") return [];

  const res = await fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
  });
  if (!res.ok) throw new Error(`NWS alerts request failed: ${res.status}`);

  const data = (await res.json()) as { features: NwsFeature[] };
  return data.features.map(({ properties: p }) => ({
    id: p.id,
    severity: p.severity,
    urgency: p.urgency,
    certainty: p.certainty,
    description: p.headline ?? p.description,
    source: p.senderName,
    areaName: p.areaDesc,
    effectiveTime: p.effective,
    expireTime: p.expires,
    detailsUrl: p["@id"],
  }));
}

export async function fetchWeather(
  lat: number,
  lon: number,
  countryCode: string,
  timezone: string,
): Promise<WeatherData> {
  const [forecast, alerts] = await Promise.all([
    fetchForecast(lat, lon, timezone),
    fetchAlerts(lat, lon, countryCode),
  ]);

  return {
    current: {
      temperature: forecast.current.temperature_2m,
      conditionCode: describeWeatherCode(forecast.current.weather_code),
    },
    daily: forecast.daily,
    hourly: forecast.hourly,
    alerts,
  };
}

// Self-check: npx tsx lib/weather.ts
if (process.argv[1]?.endsWith("weather.ts")) {
  console.assert(describeWeatherCode(0) === "Clear");
  console.assert(describeWeatherCode(2) === "Cloudy");
  console.assert(describeWeatherCode(63) === "Rain");
  console.assert(describeWeatherCode(95) === "Thunderstorm");
  fetchWeather(47.2, -122.24, "US", "America/Los_Angeles").then((w) => console.log(w.current, w.alerts.length, "alerts"));
}
