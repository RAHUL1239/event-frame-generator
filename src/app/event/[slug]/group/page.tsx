import { redirect } from "next/navigation";
import { publicEventPath } from "@/lib/event-paths";

export default async function EventGroupRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(publicEventPath(slug));
}
