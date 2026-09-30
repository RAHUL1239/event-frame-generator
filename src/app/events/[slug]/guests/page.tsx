import { redirect } from "next/navigation";
import { publicEventGuestsPath } from "@/lib/event-paths";

export default async function LegacyEventGuestsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(publicEventGuestsPath(slug));
}
