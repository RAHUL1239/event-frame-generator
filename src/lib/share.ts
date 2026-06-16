export type ShareTarget = "facebook" | "whatsapp" | "twitter" | "native" | "copy-link";

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

export function getTwitterShareUrl(text: string, pageUrl?: string) {
  const params = new URLSearchParams({ text });
  if (pageUrl) params.set("url", pageUrl);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function getWhatsAppShareUrl(text: string, pageUrl?: string) {
  const message = pageUrl ? `${text}\n\n${pageUrl}` : text;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
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

export function openFacebook() {
  window.open("https://www.facebook.com/", "_blank", "noopener,noreferrer");
}

export type FacebookPostResult = {
  mode: "native" | "guided";
  captionCopied: boolean;
  imageCopied: boolean;
  downloaded: boolean;
};

/**
 * Facebook's website cannot accept images or pre-filled text from other apps.
 * On mobile we try the native share sheet first; on desktop we download the
 * image, copy the caption, and show step-by-step instructions.
 */
export async function prepareFacebookPost(
  dataUrl: string,
  filename: string,
  caption: string
): Promise<FacebookPostResult> {
  const native = await shareImageNative(dataUrl, caption, caption);
  if (native === "shared") {
    return {
      mode: "native",
      captionCopied: false,
      imageCopied: false,
      downloaded: false,
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
  };
}
