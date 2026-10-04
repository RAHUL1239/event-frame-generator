import type { EventWithOptions } from "@/lib/types";
import Link from "next/link";

export function EventFooter({ event }: { event: EventWithOptions }) {
  return (
    <footer
      className="mt-auto py-6 text-center text-white"
      style={{ backgroundColor: event.primaryColor }}
    >
      <p className="px-4 text-xl font-medium" style={{ color: event.accentColor }}>
        {event.tagline}
      </p>
      <p className="mt-2 text-lg leading-relaxed text-white/80 sm:text-xl">
        {event.name} · {event.dateLabel}
      </p>
      <Link
        href="/admin"
        className="mt-3 inline-block text-sm text-white/50 underline hover:text-white/80"
      >
        Admin
      </Link>
    </footer>
  );
}
