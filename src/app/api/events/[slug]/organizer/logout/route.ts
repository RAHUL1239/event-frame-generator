import { NextResponse } from "next/server";
import { organizerCookieName } from "@/lib/event-organizer-session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(organizerCookieName(slug), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
