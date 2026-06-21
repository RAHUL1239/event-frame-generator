import type { EventWithOptions } from "@/lib/types";
import { getEventLogoUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type Props = {
  event: EventWithOptions;
};

export function EventHeader({ event }: Props) {
  const homeHref = `/events/${event.slug}/personal`;

  return (
    <header
      className="text-white shadow-md"
      style={{ backgroundColor: event.primaryColor }}
    >
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link
          href={homeHref}
          className="flex items-center gap-4 rounded-lg transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
          aria-label={`Back to ${event.name} home`}
        >
          <Image
            src={getEventLogoUrl(event)}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
            unoptimized
          />
          <div className="min-w-0">
            <h1
              className="text-2xl font-bold leading-snug md:text-3xl"
              style={{ color: event.accentColor }}
            >
              {event.name}
            </h1>
            <p className="mt-1 text-sm uppercase tracking-wider text-white/90 md:mt-4">
              {event.subtitle}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
