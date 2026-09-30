import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicEvent } from "@/lib/public-event";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      genderOptions: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!event || !event.isActive) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(toPublicEvent(event));
}
