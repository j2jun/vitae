import jwt from "jsonwebtoken";

// Apple's guidance is to reuse a signed token rather than mint one per
// request; tokens are valid up to ~1h, so cache and refresh a bit early.
const TOKEN_TTL_SECONDS = 60 * 55;

let cachedToken: { value: string; expiresAt: number } | null = null;

function getSigningKey(): string {
  const key = process.env.APPLE_WEATHERKIT_PRIVATE_KEY;
  if (!key) throw new Error("APPLE_WEATHERKIT_PRIVATE_KEY is not set");
  return key.includes("BEGIN PRIVATE KEY") ? key : key.replace(/\\n/g, "\n");
}

function getToken(): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - now > 60) {
    return cachedToken.value;
  }

  const teamId = process.env.APPLE_WEATHERKIT_TEAM_ID;
  const serviceId = process.env.APPLE_WEATHERKIT_SERVICE_ID;
  const keyId = process.env.APPLE_WEATHERKIT_KEY_ID;
  if (!teamId || !serviceId || !keyId) {
    throw new Error("Apple WeatherKit credentials are not configured");
  }

  const exp = now + TOKEN_TTL_SECONDS;
  const value = jwt.sign({ iss: teamId, iat: now, exp, sub: serviceId }, getSigningKey(), {
    algorithm: "ES256",
    header: { alg: "ES256", kid: keyId, id: `${teamId}.${serviceId}` } as jwt.JwtHeader,
  });

  cachedToken = { value, expiresAt: exp };
  return value;
}

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

export interface WeatherKitData {
  current: unknown;
  daily: unknown;
  hourly: unknown;
  alerts: WeatherAlert[];
}

export async function fetchWeather(
  lat: number,
  lon: number,
  countryCode: string,
  timezone: string,
): Promise<WeatherKitData> {
  const url = new URL(`https://weatherkit.apple.com/api/v1/weather/en/${lat}/${lon}`);
  url.searchParams.set("dataSets", "currentWeather,forecastDaily,forecastHourly,weatherAlerts");
  url.searchParams.set("timezone", timezone);
  // WeatherKit's alerts dataset is keyed on the issuing authority's country,
  // via the "country" param — "countryCode" is silently ignored.
  url.searchParams.set("country", countryCode);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) {
    throw new Error(`WeatherKit request failed: ${res.status}`);
  }

  const data = await res.json();

  return {
    current: data.currentWeather,
    daily: data.forecastDaily,
    hourly: data.forecastHourly,
    alerts: (data.weatherAlerts?.alerts ?? []) as WeatherAlert[],
  };
}
