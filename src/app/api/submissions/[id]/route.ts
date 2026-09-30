import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicEvent } from "@/lib/public-event";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      event: {
        include: { genderOptions: { orderBy: { sortOrder: "asc" } } },
      },
      fileUploads: true,
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...submission,
    event: toPublicEvent(submission.event),
  });
}
