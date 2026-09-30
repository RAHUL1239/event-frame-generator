import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

type OrganizerToken = {
  eventId: string;
  exp: number;
};

function sessionSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  return secret;
}

export function organizerCookieName(slug: string): string {
  const safe = slug.replace(/[^a-z0-9_-]/gi, "");
  return `event_organizer_${safe}`;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function signaturesMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(actualBytes, expectedBytes);
}

export function createOrganizerToken(eventId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      eventId,
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
    } satisfies OrganizerToken)
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readOrganizerToken(
  token: string | undefined,
  eventId: string
): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  try {
    if (!signaturesMatch(signature, sign(payload))) return false;
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as OrganizerToken;
    return data.eventId === eventId && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isOrganizerSignedIn(
  slug: string,
  eventId: string
): Promise<boolean> {
  const jar = await cookies();
  return readOrganizerToken(jar.get(organizerCookieName(slug))?.value, eventId);
}

export const ORGANIZER_COOKIE_MAX_AGE = MAX_AGE_SECONDS;
