import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import {
  isFrameThemeKey,
  parseEnabledFrameThemes,
} from "@/lib/frame-themes";
import { calculateParticipantNumber } from "@/lib/participant-number";
import { getClientIp } from "@/lib/server-utils";

function resolveSubmissionFrameTheme(
  enabledFrameThemes: string | null | undefined,
  requestedKey: string | null
): string | null {
  const enabled = parseEnabledFrameThemes(enabledFrameThemes);
  if (enabled.length === 0) return null;
  if (
    requestedKey &&
    isFrameThemeKey(requestedKey) &&
    enabled.includes(requestedKey)
  ) {
    return requestedKey;
  }
  return enabled[0];
}

async function participantNumberForSubmission(
  eventId: string,
  participantCountBase: number,
  createdAt: Date
) {
  const ordinal = await prisma.submission.count({
    where: { eventId, createdAt: { lte: createdAt } },
  });
  return calculateParticipantNumber(participantCountBase, ordinal);
}

type FileMeta = {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  memberIndex?: number;
};

function parseFileMeta(formData: FormData): FileMeta[] {
  const raw = formData.get("fileMeta");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function buildFileUploads(files: FileMeta[]) {
  return files.map((file) => ({
    originalName: file.originalName,
    storedName: `${uuidv4()}-${file.originalName}`,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    memberIndex: file.memberIndex ?? null,
  }));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const formData = await request.formData();
    const type = String(formData.get("type") || "personal");

    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const clientIp = getClientIp(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const posterDataUrl = String(formData.get("posterDataUrl") || "") || null;
    const dpDataUrl = String(formData.get("dpDataUrl") || "") || null;
    const frameThemeKey = resolveSubmissionFrameTheme(
      event.enabledFrameThemes,
      String(formData.get("frameThemeKey") || "") || null
    );

    if (type === "personal") {
      const fileMeta = parseFileMeta(formData);
      if (fileMeta.length === 0) {
        return NextResponse.json({ error: "Photo metadata required" }, { status: 400 });
      }

      const submission = await prisma.submission.create({
        data: {
          eventId: event.id,
          type: "personal",
          firstName: String(formData.get("firstName") || ""),
          lastName: String(formData.get("lastName") || ""),
          city: String(formData.get("city") || ""),
          role: String(formData.get("role") || ""),
          genderKey: String(formData.get("genderKey") || ""),
          frameThemeKey,
          posterDataUrl,
          dpDataUrl,
          clientIp,
          userAgent,
          fileUploads: { create: buildFileUploads(fileMeta) },
        },
        include: { fileUploads: true },
      });

      await prisma.auditLog.create({
        data: {
          eventId: event.id,
          action: "submission.created",
          entity: "submission",
          entityId: submission.id,
          metadata: JSON.stringify({
            type: "personal",
            firstName: submission.firstName,
            lastName: submission.lastName,
            files: submission.fileUploads.map((f) => ({
              originalName: f.originalName,
              storedName: f.storedName,
              sizeBytes: f.sizeBytes,
            })),
          }),
          clientIp,
          userAgent,
        },
      });

      return NextResponse.json({
        id: submission.id,
        participantNumber: await participantNumberForSubmission(
          event.id,
          event.participantCountBase,
          submission.createdAt
        ),
      });
    }

    const memberCount = Number(formData.get("memberCount") || 2);
    const membersJson = String(formData.get("members") || "[]");
    const members = JSON.parse(membersJson) as { name: string; role?: string }[];
    const fileMeta = parseFileMeta(formData);

    if (fileMeta.length < memberCount) {
      return NextResponse.json(
        { error: "Photo metadata required for each member" },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.create({
      data: {
        eventId: event.id,
        type: "group",
        groupName: String(formData.get("groupName") || ""),
        city: String(formData.get("city") || ""),
        memberCount,
        memberDetails: JSON.stringify(members),
        frameThemeKey,
        posterDataUrl,
        dpDataUrl,
        clientIp,
        userAgent,
        fileUploads: { create: buildFileUploads(fileMeta) },
      },
      include: { fileUploads: true },
    });

    await prisma.auditLog.create({
      data: {
        eventId: event.id,
        action: "submission.created",
        entity: "submission",
        entityId: submission.id,
        metadata: JSON.stringify({
          type: "group",
          groupName: submission.groupName,
          memberCount,
          files: submission.fileUploads.map((f) => ({
            originalName: f.originalName,
            storedName: f.storedName,
            sizeBytes: f.sizeBytes,
            memberIndex: f.memberIndex,
          })),
        }),
        clientIp,
        userAgent,
      },
    });

    return NextResponse.json({
      id: submission.id,
      participantNumber: await participantNumberForSubmission(
        event.id,
        event.participantCountBase,
        submission.createdAt
      ),
    });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }
}
