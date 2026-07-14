"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const array = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    array[i] = rawData.charCodeAt(i);
  }
  return array;
}

type Status = "idle" | "subscribing" | "subscribed" | "error";

export default function PushSubscribe() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setStatus("subscribing");
    setError(null);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications aren't supported in this browser.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission was denied.");
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("Push isn't configured yet.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject),
      );
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          timezone,
        }),
      });

      if (!res.ok) throw new Error("Couldn't save the subscription.");
      setStatus("subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "subscribed") return <p>Severe weather alerts enabled.</p>;

  return (
    <div>
      <button onClick={subscribe} disabled={status === "subscribing"}>
        {status === "subscribing" ? "Enabling…" : "Enable severe weather alerts"}
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
