export interface CommuteEta {
  travelTimeSeconds: number;
  delaySeconds: number;
}

export async function fetchCommuteEta(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
): Promise<CommuteEta> {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) throw new Error("TOMTOM_API_KEY is not set");

  const url = new URL(
    `https://api.tomtom.com/routing/1/calculateRoute/${originLat},${originLon}:${destLat},${destLon}/json`,
  );
  url.searchParams.set("key", apiKey);
  url.searchParams.set("traffic", "true");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TomTom routing request failed: ${res.status}`);
  }

  const data = await res.json();
  const summary = data.routes?.[0]?.summary;
  if (!summary) {
    throw new Error("no route found between those two points");
  }

  return {
    travelTimeSeconds: summary.travelTimeInSeconds,
    delaySeconds: summary.trafficDelayInSeconds ?? 0,
  };
}
