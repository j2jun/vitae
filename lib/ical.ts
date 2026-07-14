import ical from "node-ical";

export interface CalendarEvent {
  uid: string;
  summary: string;
  location?: string;
  start: string;
  isFullDay: boolean;
}

function toText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "val" in value) {
    return String((value as { val: unknown }).val);
  }
  return undefined;
}

// Pulls events in [now, now + daysAhead] out of a remote ICS feed, expanding
// recurring events (RRULE) via node-ical rather than hand-rolling recurrence.
export async function fetchUpcomingEvents(
  feedUrl: string,
  daysAhead = 14,
): Promise<CalendarEvent[]> {
  const parsed = await ical.fromURL(feedUrl);

  const from = new Date();
  const to = new Date(from.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const events: CalendarEvent[] = [];

  for (const component of Object.values(parsed)) {
    if (component.type !== "VEVENT") continue;

    const instances = ical.expandRecurringEvent(component, { from, to });
    for (const instance of instances) {
      events.push({
        uid: component.uid,
        summary: toText(instance.summary) ?? "(untitled event)",
        location: toText(component.location),
        start: instance.start.toISOString(),
        isFullDay: instance.isFullDay,
      });
    }
  }

  events.sort((a, b) => a.start.localeCompare(b.start));
  return events;
}
