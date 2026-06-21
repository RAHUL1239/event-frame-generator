const FONT_LINK_ID = "poster-google-fonts";

export const POSTER_FONT_FAMILY =
  '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';

let fontsReady: Promise<void> | null = null;

export function posterFont(
  weight: 400 | 500 | 600 | 700 | "bold" | "normal",
  sizePx: number
): string {
  const numeric =
    weight === "bold" ? 700 : weight === "normal" ? 400 : weight;
  return `${numeric} ${sizePx}px ${POSTER_FONT_FAMILY}`;
}

export async function ensurePosterFontsLoaded(): Promise<void> {
  if (typeof document === "undefined") return;
  if (fontsReady) return fontsReady;

  fontsReady = (async () => {
    if (!document.getElementById(FONT_LINK_ID)) {
      const link = document.createElement("link");
      link.id = FONT_LINK_ID;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans:wght@400;600;700&display=swap";
      document.head.appendChild(link);
      await new Promise<void>((resolve) => {
        link.onload = () => resolve();
        link.onerror = () => resolve();
      });
    }

    await Promise.all([
      document.fonts.load(posterFont(700, 49)),
      document.fonts.load(posterFont(700, 40)),
      document.fonts.load(posterFont(700, 37)),
      document.fonts.load(posterFont(700, 34)),
      document.fonts.load(posterFont(700, 32)),
      document.fonts.load(posterFont(700, 36)),
      document.fonts.load(posterFont(600, 30)),
      document.fonts.load(posterFont(600, 29)),
      document.fonts.load(posterFont(600, 28)),
      document.fonts.load(posterFont(600, 24)),
      document.fonts.load(posterFont(600, 22)),
      document.fonts.load(posterFont(500, 18)),
      document.fonts.load(posterFont(500, 16)),
      document.fonts.load(posterFont(700, 26)),
    ]);
    await document.fonts.ready;
  })();

  return fontsReady;
}
