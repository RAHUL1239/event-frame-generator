export async function loadQrCodeImage(
  url: string,
  size = 128
): Promise<HTMLImageElement | null> {
  try {
    const { default: QRCode } = await import("qrcode");
    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return await loadDataUrlImage(dataUrl);
  } catch {
    return null;
  }
}

function loadDataUrlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function normalizeQrTarget(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) {
    const base = getSiteOrigin();
    return base ? `${base}${trimmed}` : trimmed;
  }
  return `https://${trimmed}`;
}

function getSiteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://rsvpshare.com";
}

export function getEventQrUrl(
  event: { slug: string },
  page: "personal" | "group",
  configQr?: string
): string | undefined {
  const custom = configQr?.trim();
  if (custom) return normalizeQrTarget(custom);

  const base = getSiteOrigin();
  if (!base) return undefined;

  return `${base}/events/${event.slug}/${page}`;
}
