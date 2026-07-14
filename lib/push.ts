import webPush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error("VAPID push credentials are not configured");
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Returns false when the push service reports the subscription is gone
// (410/404) — the caller should delete that row rather than retry it.
export async function sendPush(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<boolean> {
  ensureConfigured();

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
    return true;
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return false;
    }
    throw err;
  }
}
