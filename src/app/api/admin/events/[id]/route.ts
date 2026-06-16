import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/server-utils";

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
    include: {
      genderOptions: { orderBy: { sortOrder: "asc" } },
      submissions: {
        include: { fileUploads: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(event);
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

  const event = await prisma.event.update({
    where: { id },
    data: {
      name: body.name,
      subtitle: body.subtitle,
      tagline: body.tagline,
      dateLabel: body.dateLabel,
      location: body.location,
      isActive: body.isActive,
      primaryColor: body.primaryColor,
      accentColor: body.accentColor,
      backgroundColor: body.backgroundColor,
      logoUrl: body.logoUrl,
    },
    include: { genderOptions: { orderBy: { sortOrder: "asc" } } },
  });

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

  await prisma.auditLog.create({
    data: {
      eventId: id,
      adminId: session.user.id,
      action: "event.updated",
      entity: "event",
      entityId: id,
      metadata: JSON.stringify(body),
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
  });

  const updated = await prisma.event.findUnique({
    where: { id },
    include: { genderOptions: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(updated);
}
