export type ShareTarget = "facebook" | "whatsapp" | "twitter" | "native" | "copy-link";

export type EventShareInfo = {
  name: string;
  dateLabel: string;
  facebookGroupName?: string | null;
  facebookGroupUrl?: string | null;
};

export function getPreviewPageUrl(): string {
  if (typeof window !== "undefined") return window.location.href;
  return "";
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host.endsWith(".local")
    );
  } catch {
    return true;
  }
}

/** Preview links are only useful when deployed to a public URL. */
export function getShareablePageUrl(): string | undefined {
  const url = getPreviewPageUrl();
  if (!url || isLocalhostUrl(url)) return undefined;
  return url;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Try to open the native app on mobile; fall back to the web URL. */
export function openMobileApp(appUrl: string, webUrl: string) {
  if (typeof window === "undefined") return;

  if (!isMobileDevice()) {
    window.open(webUrl, "_blank", "noopener,noreferrer");
    return;
  }

  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
  const clearFallback = () => {
    if (fallbackTimer) clearTimeout(fallbackTimer);
    document.removeEventListener("visibilitychange", onHide);
  };
  const onHide = () => {
    if (document.hidden) clearFallback();
  };

  document.addEventListener("visibilitychange", onHide);
  fallbackTimer = setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    window.location.href = webUrl;
  }, 1500);

  window.location.href = appUrl;
}

export function buildShareCaption(event: EventShareInfo, pageUrl?: string): string {
  const lines = [`Join me at ${event.name}! ${event.dateLabel}`];

  if (event.facebookGroupName || event.facebookGroupUrl) {
    if (event.facebookGroupName) {
      lines.push(`Share in our Facebook group: ${event.facebookGroupName}`);
    }
    if (event.facebookGroupUrl) {
      lines.push(event.facebookGroupUrl);
    }
  }

  if (pageUrl) lines.push(pageUrl);
  return lines.join("\n");
}

export function getTwitterShareUrl(text: string, pageUrl?: string) {
  const params = new URLSearchParams({ text });
  if (pageUrl) params.set("url", pageUrl);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function getTwitterAppUrl(text: string, pageUrl?: string) {
  const message = pageUrl ? `${text} ${pageUrl}` : text;
  return `twitter://post?message=${encodeURIComponent(message)}`;
}

export function openTwitterShare(text: string, pageUrl?: string) {
  openMobileApp(
    getTwitterAppUrl(text, pageUrl),
    getTwitterShareUrl(text, pageUrl)
  );
}

export function getWhatsAppShareUrl(text: string, pageUrl?: string) {
  const message = pageUrl ? `${text}\n\n${pageUrl}` : text;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppAppUrl(text: string, pageUrl?: string) {
  const message = pageUrl ? `${text}\n\n${pageUrl}` : text;
  return `whatsapp://send?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppShare(text: string, pageUrl?: string) {
  openMobileApp(
    getWhatsAppAppUrl(text, pageUrl),
    getWhatsAppShareUrl(text, pageUrl)
  );
}

export function getFacebookWebUrl(groupUrl?: string | null) {
  return groupUrl || "https://www.facebook.com/";
}

export function getFacebookAppUrl(groupUrl?: string | null) {
  const target = getFacebookWebUrl(groupUrl);
  return `fb://facewebmodal/f?href=${encodeURIComponent(target)}`;
}

export function openFacebook(groupUrl?: string | null) {
  openMobileApp(getFacebookAppUrl(groupUrl), getFacebookWebUrl(groupUrl));
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}

export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function shareImageNative(
  dataUrl: string,
  title: string,
  text: string
): Promise<"shared" | "unsupported"> {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], "event-frame.png", { type: "image/png" });

  if (navigator.share) {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
        return "shared";
      }
      const shareUrl = getShareablePageUrl();
      if (shareUrl) {
        await navigator.share({ title, text, url: shareUrl });
      } else {
        await navigator.share({ title, text });
      }
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "unsupported";
      throw err;
    }
  }
  return "unsupported";
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export type FacebookPostResult = {
  mode: "native" | "guided";
  captionCopied: boolean;
  imageCopied: boolean;
  downloaded: boolean;
  facebookGroupName?: string | null;
  facebookGroupUrl?: string | null;
};

/**
 * Facebook cannot pre-fill posts or auto-tag groups from a website.
 * We copy a caption that includes the group name/URL and open the group in the FB app when possible.
 */
export async function prepareFacebookPost(
  dataUrl: string,
  filename: string,
  caption: string,
  facebookGroupUrl?: string | null,
  facebookGroupName?: string | null
): Promise<FacebookPostResult> {
  const native = await shareImageNative(dataUrl, caption, caption);
  if (native === "shared") {
    return {
      mode: "native",
      captionCopied: false,
      imageCopied: false,
      downloaded: false,
      facebookGroupName,
      facebookGroupUrl,
    };
  }

  downloadDataUrl(dataUrl, filename);
  const captionCopied = await copyTextToClipboard(caption);
  const imageCopied = await copyImageToClipboard(dataUrl);

  return {
    mode: "guided",
    captionCopied,
    imageCopied,
    downloaded: true,
    facebookGroupName,
    facebookGroupUrl,
  };
}
