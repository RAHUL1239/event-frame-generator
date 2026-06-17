import type { FrameThemeDefinition } from "@/lib/frame-themes";

type Props = {
  theme: FrameThemeDefinition;
  eventName?: string;
};

function BorderDecoration({
  borderStyle,
  primary,
  accent,
}: {
  borderStyle: FrameThemeDefinition["borderStyle"];
  primary: string;
  accent: string;
}) {
  const base = "pointer-events-none absolute inset-2";

  switch (borderStyle) {
    case "ornate":
      return (
        <>
          <div
            className={`${base} border-[3px]`}
            style={{ borderColor: primary }}
          />
          <div
            className={`${base} m-1.5 border`}
            style={{ borderColor: accent }}
          />
        </>
      );
    case "bold":
      return (
        <>
          <div
            className={`${base} border-[5px]`}
            style={{ borderColor: primary }}
          />
          <div
            className={`${base} m-2 border-2`}
            style={{ borderColor: accent }}
          />
        </>
      );
    case "double":
      return (
        <>
          <div
            className={`${base} border-2`}
            style={{ borderColor: primary }}
          />
          <div
            className={`${base} m-1 border`}
            style={{ borderColor: accent }}
          />
        </>
      );
    case "premium":
      return (
        <>
          <div
            className={`${base} border-2`}
            style={{ borderColor: accent }}
          />
          <div
            className={`${base} m-1 border`}
            style={{ borderColor: primary }}
          />
        </>
      );
    case "classic":
      return (
        <>
          <div
            className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l-[3px] border-t-[3px]"
            style={{ borderColor: accent }}
          />
          <div
            className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r-[3px] border-t-[3px]"
            style={{ borderColor: accent }}
          />
          <div
            className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b-[3px] border-l-[3px]"
            style={{ borderColor: accent }}
          />
          <div
            className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-[3px] border-r-[3px]"
            style={{ borderColor: accent }}
          />
        </>
      );
    case "minimal":
    default:
      return (
        <div className={`${base} border`} style={{ borderColor: accent }} />
      );
  }
}

export function FrameThemePreview({ theme, eventName = "Your Event" }: Props) {
  const { primary, accent, background } = theme.colors;
  const ringPx = Math.min(theme.photoRingWidth, 6);

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-lg shadow-md"
      style={{ backgroundColor: background }}
    >
      <BorderDecoration
        borderStyle={theme.borderStyle}
        primary={primary}
        accent={accent}
      />

      <div className="relative z-10 px-4 pt-4">
        <div className="mx-auto mb-2 h-2 w-8 rounded bg-gray-200/80" />
        <p
          className="truncate text-center text-[10px] font-bold uppercase leading-tight"
          style={{ color: primary }}
        >
          {eventName}
        </p>
        <p
          className="mt-0.5 text-center text-[8px] font-semibold"
          style={{ color: accent }}
        >
          EVENT DATE
        </p>
      </div>

      <div className="relative z-10 mt-3 flex items-center gap-3 px-4">
        <div
          className="relative h-14 w-14 shrink-0 rounded-full bg-gray-300"
          style={{ boxShadow: `0 0 0 ${ringPx}px ${accent}` }}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div
            className="h-1.5 w-full rounded"
            style={{ backgroundColor: accent, opacity: 0.85 }}
          />
          <div
            className="h-1.5 w-[80%] rounded"
            style={{ backgroundColor: primary, opacity: 0.75 }}
          />
          <div
            className="h-1.5 w-[60%] rounded"
            style={{ backgroundColor: theme.colors.gold, opacity: 0.8 }}
          />
        </div>
      </div>

      <div className="relative z-10 mt-3 px-4">
        <div className="h-px bg-gray-200" />
        <p
          className="mt-1 text-center text-[7px] font-medium"
          style={{ color: primary }}
        >
          Event tagline
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-5"
        style={{ backgroundColor: primary }}
      />
    </div>
  );
}
