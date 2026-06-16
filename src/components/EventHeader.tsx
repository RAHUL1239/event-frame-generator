import type { EventWithOptions } from "@/lib/types";
import { getEventLogoUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

type Props = {
  event: EventWithOptions;
  activeTab: "personal" | "group";
  basePath: string;
};

export function EventHeader({ event, activeTab, basePath }: Props) {
  return (
    <header
      className="text-white shadow-md"
      style={{ backgroundColor: event.primaryColor }}
    >
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center gap-4">
          <Image
            src={getEventLogoUrl(event)}
            alt={event.name}
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
            unoptimized
          />
          <div>
            <h1
              className="text-2xl font-bold md:text-3xl"
              style={{ color: event.accentColor }}
            >
              {event.name}
            </h1>
            <p className="text-sm uppercase tracking-wider text-white/90">
              {event.subtitle}
            </p>
          </div>
        </div>

        <nav className="mt-6 flex gap-8 border-b border-white/20">
          <Link
            href={`${basePath}/personal`}
            className={`pb-3 text-sm font-semibold uppercase tracking-wide transition ${
              activeTab === "personal"
                ? "border-b-4"
                : "text-white/70 hover:text-white"
            }`}
            style={
              activeTab === "personal"
                ? { borderColor: event.accentColor, color: event.accentColor }
                : undefined
            }
          >
            Personal DP
          </Link>
          <Link
            href={`${basePath}/group`}
            className={`pb-3 text-sm font-semibold uppercase tracking-wide transition ${
              activeTab === "group"
                ? "border-b-4"
                : "text-white/70 hover:text-white"
            }`}
            style={
              activeTab === "group"
                ? { borderColor: event.accentColor, color: event.accentColor }
                : undefined
            }
          >
            Group DP
          </Link>
        </nav>
      </div>
    </header>
  );
}
