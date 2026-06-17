import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  mimeToLogoExt,
  resolveLogoMimeType,
  saveEventLogo,
} from "@/lib/logo-storage";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/server-utils";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("logo");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Logo file is required" }, { status: 400 });
    }

    const mime = resolveLogoMimeType(file);
    if (!mime) {
      return NextResponse.json(
        { error: "Logo must be PNG, JPEG, or WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Logo must be 5 MB or smaller" },
        { status: 400 }
      );
    }

    const ext = mimeToLogoExt(mime);
    const logoUrl = await saveEventLogo(event.slug, file, ext);

    const updated = await prisma.event.update({
      where: { id },
      data: { logoUrl },
      include: { genderOptions: { orderBy: { sortOrder: "asc" } } },
    });

    await prisma.auditLog.create({
      data: {
        eventId: id,
        adminId: session.user.id,
        action: "event.logo_uploaded",
        entity: "event",
        entityId: id,
        metadata: JSON.stringify({ logoUrl }),
        clientIp: getClientIp(request),
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Logo upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload logo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
