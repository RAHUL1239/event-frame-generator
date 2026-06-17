import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDefaultGenderOptions } from "@/lib/default-gender-options";
import { getClientIp } from "@/lib/server-utils";
import { slugify } from "@/lib/slug";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    include: {
      _count: { select: { submissions: true, auditLogs: true } },
      genderOptions: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const slug = slugify(String(body.slug || name));
  const tagline = String(body.tagline ?? "").trim();
  const dateLabel = String(body.dateLabel ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Event name is required" }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: "URL slug is required" }, { status: 400 });
  }
  if (!tagline) {
    return NextResponse.json({ error: "Footer tagline is required" }, { status: 400 });
  }
  if (!dateLabel) {
    return NextResponse.json({ error: "Date label is required" }, { status: 400 });
  }

  const existing = await prisma.event.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "An event with this URL slug already exists" },
      { status: 409 }
    );
  }

  const genderOptions = buildDefaultGenderOptions(name);

  const event = await prisma.event.create({
    data: {
      slug,
      name,
      subtitle: body.subtitle ?? "PROFILE FRAME & POSTER GENERATOR",
      tagline,
      dateLabel,
      location: body.location?.trim() || null,
      facebookGroupName: body.facebookGroupName?.trim() || null,
      facebookGroupUrl: body.facebookGroupUrl?.trim() || null,
      isActive: body.isActive ?? true,
      primaryColor: body.primaryColor ?? "#1a4d4a",
      accentColor: body.accentColor ?? "#c9a227",
      backgroundColor: body.backgroundColor ?? "#f5f0e8",
      participantCountBase: Math.max(0, Number(body.participantCountBase) || 0),
      genderOptions: {
        create: genderOptions,
      },
    },
    include: { genderOptions: { orderBy: { sortOrder: "asc" } } },
  });

  await prisma.auditLog.create({
    data: {
      eventId: event.id,
      adminId: session.user.id,
      action: "event.created",
      entity: "event",
      entityId: event.id,
      metadata: JSON.stringify({ slug: event.slug, name: event.name }),
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
