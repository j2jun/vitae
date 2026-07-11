import { reverseGeocode } from "@/lib/geocode";
import { fetchWeather } from "@/lib/weatherkit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const timezone = searchParams.get("timezone");

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !timezone) {
    return Response.json(
      { error: "lat, lon, and timezone are required" },
      { status: 400 },
    );
  }

  try {
    const { countryCode, city } = await reverseGeocode(lat, lon);
    const weather = await fetchWeather(lat, lon, countryCode, timezone);
    return Response.json({ city, countryCode, ...weather });
  } catch {
    return Response.json({ error: "weather lookup failed" }, { status: 502 });
  }
}
