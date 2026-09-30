import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  ORGANIZER_COOKIE_MAX_AGE,
  createOrganizerToken,
  organizerCookieName,
} from "@/lib/event-organizer-session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      organizerUsername: true,
      organizerPasswordHash: true,
    },
  });

  const hash = event?.organizerPasswordHash;
  const passwordOk = hash ? await bcrypt.compare(password, hash) : false;
  const usernameOk =
    Boolean(event?.organizerUsername) && username === event?.organizerUsername;

  if (!event || !usernameOk || !passwordOk) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(organizerCookieName(slug), createOrganizerToken(event.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ORGANIZER_COOKIE_MAX_AGE,
  });
  return response;
}
