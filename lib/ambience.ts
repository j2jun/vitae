// Theme + effects settings. They live as data-* attributes on <html>, which
// globals.css reads, so changing one restyles the page with no re-render.

export type Skin = "sky" | "pulse" | "aurora";
export type Fx = "off" | "subtle" | "lively";

export interface AmbienceSettings {
  skin: Skin;
  fx: Fx;
  weatherFx: boolean;
}

const KEY = "vitae:ambience";

// Must stay self-contained (no imports, no outside references): layout.tsx
// inlines its source into <head> so the theme applies before first paint.
export function applyAmbience() {
  let saved: { skin?: string; fx?: string; weatherFx?: boolean } = {};
  try {
    saved = JSON.parse(localStorage.getItem("vitae:ambience") || "{}");
  } catch {}
  const hour = new Date().getHours();
  const el = document.documentElement;
  el.dataset.skin = saved.skin || "sky";
  el.dataset.fx =
    saved.fx || (matchMedia("(prefers-reduced-motion: reduce)").matches ? "off" : "lively");
  el.dataset.wxfx = saved.weatherFx === false ? "off" : "on";
  el.dataset.phase =
    hour >= 5 && hour < 8 ? "dawn" : hour >= 8 && hour < 17 ? "day" : hour >= 17 && hour < 20 ? "golden" : "night";
}

export function currentAmbience(): AmbienceSettings {
  const d = document.documentElement.dataset;
  return { skin: d.skin as Skin, fx: d.fx as Fx, weatherFx: d.wxfx !== "off" };
}

export function saveAmbience(change: Partial<AmbienceSettings>) {
  const next = { ...currentAmbience(), ...change };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  applyAmbience();
  // Storage can be blocked (private mode); still apply this session's choice.
  const d = document.documentElement.dataset;
  d.skin = next.skin;
  d.fx = next.fx;
  d.wxfx = next.weatherFx ? "on" : "off";
}

// Open-Meteo condition text (lib/weather.ts) -> which weather effect to show.
export function weatherEffect(condition: string): string {
  if (/thunder/i.test(condition)) return "storm";
  if (/snow/i.test(condition)) return "snow";
  if (/rain|drizzle/i.test(condition)) return "rain";
  if (/clear/i.test(condition)) return "clear";
  return "cloudy";
}
