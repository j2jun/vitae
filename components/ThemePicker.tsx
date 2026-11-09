"use client";

import { useEffect, useState } from "react";
import { currentAmbience, saveAmbience, type AmbienceSettings, type Fx, type Skin } from "@/lib/ambience";

const SKINS: { id: Skin; name: string }[] = [
  { id: "sky", name: "Living sky" },
  { id: "pulse", name: "Energy pulse" },
  { id: "aurora", name: "Aurora glass" },
];
const FX: Fx[] = ["off", "subtle", "lively"];

export default function ThemePicker() {
  const [settings, setSettings] = useState<AmbienceSettings | null>(null);
  useEffect(() => setSettings(currentAmbience()), []);

  function change(update: Partial<AmbienceSettings>) {
    saveAmbience(update);
    setSettings(currentAmbience());
  }

  return (
    <details className="theme-picker">
      <summary>Theme</summary>
      {settings && (
        <div className="theme-panel">
          <fieldset>
            <legend>Theme</legend>
            <div className="skin-options">
              {SKINS.map((s) => (
                <label key={s.id}>
                  <input
                    type="radio"
                    name="skin"
                    checked={settings.skin === s.id}
                    onChange={() => change({ skin: s.id })}
                  />
                  <span className={`swatch swatch-${s.id}`} />
                  {s.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Effects</legend>
            <div className="segmented">
              {FX.map((f) => (
                <label key={f}>
                  <input type="radio" name="fx" checked={settings.fx === f} onChange={() => change({ fx: f })} />
                  {f[0].toUpperCase() + f.slice(1)}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.weatherFx}
              onChange={(e) => change({ weatherFx: e.target.checked })}
            />
            Weather effects (rain, snow, sun, storms)
          </label>
        </div>
      )}
    </details>
  );
}
