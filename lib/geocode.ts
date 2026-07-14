export interface GeoLocation {
  countryCode: string;
  city?: string;
}

// Nominatim's usage policy caps this at 1 req/sec and requires an identifying
// User-Agent — fine at our volume, but don't fan this out in a loop.
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<GeoLocation> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");

  const res = await fetch(url, {
    headers: { "User-Agent": "vitae-daily-checkup (github.com/j2jun/vitae)" },
  });

  if (!res.ok) {
    throw new Error(`reverse geocoding failed: ${res.status}`);
  }

  const data = await res.json();
  const countryCode: string | undefined = data.address?.country_code;
  if (!countryCode) {
    throw new Error("could not resolve a country for this location");
  }

  return {
    countryCode: countryCode.toUpperCase(),
    city: data.address?.city ?? data.address?.town ?? data.address?.village,
  };
}

export interface GeocodedPoint {
  lat: number;
  lon: number;
}

// Forward geocode (address text -> lat/lon), same Nominatim host as
// reverseGeocode above.
export async function forwardGeocode(query: string): Promise<GeocodedPoint> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    headers: { "User-Agent": "vitae-daily-checkup (github.com/j2jun/vitae)" },
  });

  if (!res.ok) {
    throw new Error(`geocoding failed: ${res.status}`);
  }

  const [result] = await res.json();
  if (!result) {
    throw new Error(`couldn't find a location for "${query}"`);
  }

  return { lat: Number(result.lat), lon: Number(result.lon) };
}
