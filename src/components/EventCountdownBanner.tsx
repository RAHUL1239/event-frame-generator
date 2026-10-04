import { getEventCountdown } from "@/lib/countdown";
import type { EventWithOptions } from "@/lib/types";

type Props = {
  event: EventWithOptions;
  primaryColor: string;
  accentColor: string;
};

export function EventCountdownBanner({
  event,
  primaryColor,
  accentColor,
}: Props) {
  const countdown = getEventCountdown(event);
  if (!countdown) return null;

  return (
    <p
      className="rounded-xl px-4 py-3 text-center text-lg font-bold leading-relaxed sm:text-xl"
      style={{
        backgroundColor: `${accentColor}22`,
        color: primaryColor,
        border: `2px solid ${accentColor}`,
      }}
    >
      {countdown.message}
    </p>
  );
}
