import { redirect } from "next/navigation";
import { publicEventPreviewPath } from "@/lib/event-paths";

export default async function LegacyPreviewRoute({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  redirect(publicEventPreviewPath(slug, id));
}
