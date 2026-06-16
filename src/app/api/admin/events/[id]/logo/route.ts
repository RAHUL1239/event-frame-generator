import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveEventLogo } from "@/lib/logo-storage";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/server-utils";

const MAX_BYTES = 2 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (!MIME_TO_EXT[file.type]) {
    return NextResponse.json(
      { error: "Logo must be PNG, JPEG, or WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Logo must be 2 MB or smaller" },
      { status: 400 }
    );
  }

  const ext = MIME_TO_EXT[file.type];
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
}
