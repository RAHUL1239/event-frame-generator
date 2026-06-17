import type { FrameThemeDefinition } from "@/lib/frame-themes";

type Props = {
  theme: FrameThemeDefinition;
  eventName?: string;
  compact?: boolean;
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
        <div
          className={`${base} border`}
          style={{ borderColor: accent }}
        />
      );
  }
}

export function FrameThemePreview({
  theme,
  eventName = "Your Event",
  compact = false,
}: Props) {
  const { primary, accent, background } = theme.colors;
  const ringPx = Math.min(theme.photoRingWidth, compact ? 4 : 6);

  return (
    <div
      className={`relative overflow-hidden ${
        compact ? "aspect-[4/5] w-full" : "mx-auto aspect-square w-full max-w-sm"
      }`}
      style={{ backgroundColor: background }}
    >
      <BorderDecoration
        borderStyle={theme.borderStyle}
        primary={primary}
        accent={accent}
      />

      {/* Header */}
      <div className={`relative z-10 ${compact ? "px-2 pt-2" : "px-4 pt-4"}`}>
        <div
          className={`mx-auto rounded bg-gray-200/80 ${
            compact ? "mb-1 h-1.5 w-6" : "mb-2 h-2 w-8"
          }`}
        />
        <p
          className={`truncate text-center font-bold uppercase leading-tight ${
            compact ? "text-[7px]" : "text-[10px]"
          }`}
          style={{ color: primary }}
        >
          {eventName}
        </p>
        <p
          className={`mt-0.5 text-center font-semibold ${
            compact ? "text-[5px]" : "text-[8px]"
          }`}
          style={{ color: accent }}
        >
          EVENT DATE
        </p>
      </div>

      {/* Photo + headline area */}
      <div
        className={`relative z-10 flex items-center ${
          compact ? "mt-1 gap-1.5 px-2" : "mt-3 gap-3 px-4"
        }`}
      >
        <div
          className={`relative shrink-0 rounded-full bg-gray-300 ${
            compact ? "h-8 w-8" : "h-14 w-14"
          }`}
          style={{
            boxShadow: `0 0 0 ${ringPx}px ${accent}`,
          }}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div
            className={`rounded font-bold uppercase ${
              compact ? "h-1 w-full" : "h-1.5 w-full"
            }`}
            style={{ backgroundColor: accent, opacity: 0.85 }}
          />
          <div
            className={`rounded ${
              compact ? "h-1 w-[80%]" : "h-1.5 w-[80%]"
            }`}
            style={{ backgroundColor: primary, opacity: 0.75 }}
          />
          <div
            className={`rounded ${
              compact ? "h-1 w-[60%]" : "h-1.5 w-[60%]"
            }`}
            style={{ backgroundColor: theme.colors.gold, opacity: 0.8 }}
          />
        </div>
      </div>

      {/* Tagline */}
      <div className={`relative z-10 ${compact ? "mt-1.5 px-2" : "mt-3 px-4"}`}>
        <div className="h-px bg-gray-200" />
        <p
          className={`mt-1 text-center font-medium ${
            compact ? "text-[5px]" : "text-[7px]"
          }`}
          style={{ color: primary }}
        >
          Event tagline
        </p>
      </div>

      {/* Footer */}
      <div
        className={`absolute bottom-0 left-0 right-0 ${
          compact ? "h-3" : "h-5"
        }`}
        style={{ backgroundColor: primary }}
      />
    </div>
  );
}
