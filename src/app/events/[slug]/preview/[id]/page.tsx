import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventHeader } from "@/components/EventHeader";
import { EventFooter } from "@/components/EventFooter";
import { PreviewPage } from "@/components/PreviewPage";

export default async function PreviewRoute({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      event: {
        include: { genderOptions: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!submission || submission.event.slug !== slug) notFound();

  const backPath =
    submission.type === "group"
      ? `/events/${slug}/group`
      : `/events/${slug}/personal`;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: submission.event.backgroundColor }}
    >
      <EventHeader
        event={submission.event}
        activeTab={submission.type === "group" ? "group" : "personal"}
        basePath={`/events/${slug}`}
      />
      <main className="flex-1">
        <PreviewPage
          submission={submission}
          slug={slug}
          backPath={backPath}
        />
      </main>
      <EventFooter event={submission.event} />
    </div>
  );
}
