import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isOrganizerSignedIn } from "@/lib/event-organizer-session";
import { FRAME_THEMES, isFrameThemeKey } from "@/lib/frame-themes";
import { formatDisplayName } from "@/lib/utils";
import { OrganizerLoginForm } from "@/components/OrganizerLoginForm";
import { OrganizerGuestList } from "@/components/OrganizerGuestList";

export default async function EventGuestsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      organizerUsername: true,
      organizerPasswordHash: true,
    },
  });

  if (!event) notFound();

  const loginReady = Boolean(event.organizerUsername && event.organizerPasswordHash);
  if (!loginReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-brand-teal">{event.name}</h1>
          <p className="mt-3 text-sm text-gray-600">
            An organizer login has not been set up for this event yet.
          </p>
        </div>
      </main>
    );
  }

  const signedIn = await isOrganizerSignedIn(slug, event.id);
  if (!signedIn) {
    return <OrganizerLoginForm slug={slug} eventName={event.name} />;
  }

  const submissions = await prisma.submission.findMany({
    where: { eventId: event.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      groupName: true,
      frameThemeKey: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const guests = submissions.map((submission) => {
    const name =
      formatDisplayName(submission.firstName, submission.lastName) ||
      submission.groupName ||
      "Guest";
    const frameName =
      submission.frameThemeKey && isFrameThemeKey(submission.frameThemeKey)
        ? FRAME_THEMES[submission.frameThemeKey].name
        : "Event default";

    return {
      id: submission.id,
      name,
      frameName,
      createdAt: submission.createdAt.toISOString(),
    };
  });

  return (
    <OrganizerGuestList slug={slug} eventName={event.name} guests={guests} />
  );
}
