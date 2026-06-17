export type CountdownEvent = {
  name: string;
  dateLabel: string;
  eventDate?: Date | string | null;
};

export type EventCountdown = {
  days: number;
  message: string;
};

/** Parse the first date from labels like "July 17th & 18th, 2026". */
export function parseDateFromLabel(dateLabel: string): Date | null {
  const match = dateLabel.match(
    /([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*&\s*\d{1,2}(?:st|nd|rd|th)?)?,?\s*(\d{4})/i
  );
  if (!match) return null;

  const [, monthName, day, year] = match;
  const parsed = new Date(`${monthName} ${day}, ${year}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveEventDate(event: CountdownEvent): Date | null {
  if (event.eventDate) {
    const parsed = new Date(event.eventDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return parseDateFromLabel(event.dateLabel);
}

export function getDaysUntilEvent(
  targetDate: Date,
  now: Date = new Date()
): number {
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatCountdownMessage(eventName: string, days: number): string {
  const dayWord = days === 1 ? "Day" : "Days";
  return `🎉 Only ${days} ${dayWord} Until ${eventName}!`;
}

export function getEventCountdown(
  event: CountdownEvent,
  now: Date = new Date()
): EventCountdown | null {
  const target = resolveEventDate(event);
  if (!target) return null;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(target);
  eventDay.setHours(0, 0, 0, 0);

  if (eventDay.getTime() < today.getTime()) return null;

  const days = Math.round(
    (eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    days,
    message: formatCountdownMessage(event.name, days),
  };
}

/** Format eventDate for <input type="date" /> (YYYY-MM-DD). */
export function formatEventDateInputValue(
  value: Date | string | null | undefined
): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
