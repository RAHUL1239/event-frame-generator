import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeEnabledFrameThemesOrNull } from "@/lib/frame-themes";
import { serializeEventHighlights } from "@/lib/event-highlights";
import { normalizeMiddleTaglines, serializeMiddleTaglines } from "@/lib/middle-taglines";
import { getClientIp } from "@/lib/server-utils";

const eventDetailInclude = {
  genderOptions: { orderBy: { sortOrder: "asc" as const } },
  submissions: {
    select: {
      id: true,
      type: true,
      firstName: true,
      lastName: true,
      groupName: true,
      city: true,
      createdAt: true,
      fileUploads: {
        select: {
          originalName: true,
          storedName: true,
          sizeBytes: true,
          memberIndex: true,
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
    take: 100,
  },
  auditLogs: { orderBy: { createdAt: "desc" as const }, take: 100 },
};

const ORGANIZER_USERNAME = /^[a-z0-9][a-z0-9._-]{2,39}$/;

function toAdminEvent<T extends { organizerUsername: string | null; organizerPasswordHash: string | null }>(
  event: T
) {
  const { organizerPasswordHash, ...safe } = event;
  return {
    ...safe,
    hasOrganizerLogin: Boolean(event.organizerUsername && organizerPasswordHash),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: eventDetailInclude,
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(toAdminEvent(event));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.event.findUnique({
    where: { id },
    select: { organizerUsername: true, organizerPasswordHash: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const organizerData: {
    organizerUsername?: string | null;
    organizerPasswordHash?: string | null;
  } = {};

  if ("organizerUsername" in body || "organizerPassword" in body) {
    const username =
      typeof body.organizerUsername === "string"
        ? body.organizerUsername.trim().toLowerCase()
        : (existing.organizerUsername ?? "");
    const password =
      typeof body.organizerPassword === "string" ? body.organizerPassword : "";

    if (!username) {
      organizerData.organizerUsername = null;
      organizerData.organizerPasswordHash = null;
    } else {
      if (!ORGANIZER_USERNAME.test(username)) {
        return NextResponse.json(
          {
            error:
              "Username must be 3–40 characters and use letters, numbers, dots, underscores, or hyphens.",
          },
          { status: 400 }
        );
      }
      if (password && password.length < 8) {
        return NextResponse.json(
          { error: "Organizer password must be at least 8 characters." },
          { status: 400 }
        );
      }
      if (!password && !existing.organizerPasswordHash) {
        return NextResponse.json(
          { error: "Set a password for this organizer login." },
          { status: 400 }
        );
      }
      organizerData.organizerUsername = username;
      if (password) {
        organizerData.organizerPasswordHash = await bcrypt.hash(password, 12);
      }
    }
  }

  try {
    await prisma.event.update({
      where: { id },
      data: {
        name: body.name,
        subtitle: body.subtitle,
        tagline: body.tagline,
        dateLabel: body.dateLabel,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        location: body.location,
        facebookGroupName: body.facebookGroupName || null,
        facebookGroupUrl: body.facebookGroupUrl || null,
        isActive: body.isActive,
        primaryColor: body.primaryColor,
        accentColor: body.accentColor,
        backgroundColor: body.backgroundColor,
        logoUrl: body.logoUrl,
        participantCountBase: Math.max(0, Number(body.participantCountBase) || 0),
        enabledFrameThemes:
          body.enabledFrameThemes != null
            ? serializeEnabledFrameThemesOrNull(body.enabledFrameThemes)
            : undefined,
        eventHighlights:
          body.eventHighlights != null
            ? serializeEventHighlights(
                Array.isArray(body.eventHighlights) ? body.eventHighlights : []
              )
            : undefined,
        middleTaglines:
          body.middleTaglines != null
            ? serializeMiddleTaglines(normalizeMiddleTaglines(body.middleTaglines))
            : undefined,
        ...organizerData,
      },
      include: { genderOptions: { orderBy: { sortOrder: "asc" } } },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That username is already used by another event." },
        { status: 409 }
      );
    }
    throw error;
  }

  if (Array.isArray(body.genderOptions)) {
    for (const option of body.genderOptions) {
      await prisma.genderOption.upsert({
        where: {
          eventId_key: { eventId: id, key: option.key },
        },
        update: {
          label: option.label,
          tagline: option.tagline,
          sortOrder: option.sortOrder ?? 0,
        },
        create: {
          eventId: id,
          key: option.key,
          label: option.label,
          tagline: option.tagline,
          sortOrder: option.sortOrder ?? 0,
        },
      });
    }
  }

  const auditBody = { ...body } as Record<string, unknown>;
  delete auditBody.organizerPassword;

  await prisma.auditLog.create({
    data: {
      eventId: id,
      adminId: session.user.id,
      action: "event.updated",
      entity: "event",
      entityId: id,
      metadata: JSON.stringify(auditBody),
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
  });

  const updated = await prisma.event.findUnique({
    where: { id },
    include: eventDetailInclude,
  });

  return NextResponse.json(updated ? toAdminEvent(updated) : updated);
}
