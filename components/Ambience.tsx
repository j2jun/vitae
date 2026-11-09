"use client";

import { useEffect } from "react";
import { applyAmbience } from "@/lib/ambience";

// Deterministic spread so server and client render the same particles.
const spread = (n: number, i: number) => ((i * 61 + 17) % 100) * (n / 100);

function particles(count: number, baseSeconds: number) {
  return Array.from({ length: count }, (_, i) => (
    <i
      key={i}
      style={{
        left: `${spread(100, i)}%`,
        top: `${spread(100, i * 7 + 3)}%`,
        animationDelay: `-${spread(baseSeconds, i * 13 + 5).toFixed(2)}s`,
        ["--d" as string]: `${(baseSeconds * (0.7 + spread(0.6, i * 3 + 1))).toFixed(2)}s`,
      }}
    />
  ));
}

export default function Ambience() {
  useEffect(() => {
    applyAmbience();
    const id = setInterval(applyAmbience, 5 * 60 * 1000); // follow the clock while the tab stays open
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ambience" aria-hidden="true">
      <div className="blobs">
        <b />
        <b />
        <b />
      </div>
      <div className="stars">{particles(60, 4)}</div>
      <div className="sun" />
      <div className="rain">{particles(70, 0.9)}</div>
      <div className="snow">{particles(50, 9)}</div>
      <div className="flash" />
    </div>
  );
}
