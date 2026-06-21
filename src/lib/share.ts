export type ShareTarget = "facebook" | "instagram" | "whatsapp" | "native" | "copy-link";

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

/** Public event page where friends create their own frame. */
export function getEventInvitationUrl(slug: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/events/${slug}/personal`;
}

export function getShareableInvitationUrl(slug: string): string | undefined {
  const url = getEventInvitationUrl(slug);
  if (!url || isLocalhostUrl(url)) return undefined;
  return url;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
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

/** Caption for WhatsApp, copy-link, Instagram, and other non-Facebook shares. */
export function buildShareCaption(event: EventShareInfo, pageUrl?: string): string {
  const lines = [`Join me at ${event.name}! ${event.dateLabel}`];
  if (pageUrl) lines.push(pageUrl);
  return lines.join("\n");
}

/** Caption for Instagram image posts — no page URL. */
export function buildInstagramShareCaption(event: EventShareInfo): string {
  return `Join me at ${event.name}! ${event.dateLabel}`;
}

/** Caption for Facebook — no app page URL (URLs make Facebook create a link post). */
export function buildFacebookShareCaption(event: EventShareInfo): string {
  const lines = [`Please join us at ${event.name}! ${event.dateLabel}`];

  if (event.facebookGroupName) {
    lines.push(`Tag our Facebook group: @${event.facebookGroupName}`);
  } else if (event.facebookGroupUrl) {
    lines.push(event.facebookGroupUrl);
  }

  return lines.join("\n");
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

export type GuidedShareResult = {
  mode: "guided";
  imageCopied: boolean;
  captionCopied: boolean;
};

export type SocialPostFlowResult =
  | "shared"
  | "opened"
  | "cancelled"
  | GuidedShareResult;

export function getGuidedShareToastMessage(
  platform: "whatsapp" | "facebook" | "instagram",
  result: GuidedShareResult
): string {
  if (result.imageCopied) {
    if (platform === "whatsapp") {
      return "Poster copied! WhatsApp Web is open — click the message box and press Ctrl+V (⌘+V on Mac) to paste the image.";
    }
    if (platform === "facebook") {
      return "Poster copied! Facebook is open — start a new post and press Ctrl+V (⌘+V on Mac) to paste the image. Caption is copied too.";
    }
    return "Poster copied! Instagram is open — start a new post and press Ctrl+V (⌘+V on Mac) to paste the image. Caption is copied too.";
  }

  if (platform === "whatsapp") {
    return "Poster downloaded and invitation text copied. Attach the PNG in WhatsApp Web, then paste the text.";
  }
  if (platform === "facebook") {
    return "Poster downloaded and caption copied. Upload the PNG on Facebook, then paste the caption.";
  }
  return "Poster downloaded and caption copied. Upload the PNG on Instagram (Stories work best in the mobile app).";
}

/**
 * Share poster to WhatsApp. Mobile uses the system share sheet when available.
 * Desktop opens WhatsApp Web with text pre-filled and copies the image for paste.
 */
export async function openWhatsAppPostFlow(
  posterDataUrl: string | null,
  filename: string,
  text: string,
  pageUrl?: string
): Promise<SocialPostFlowResult> {
  const caption = pageUrl ? `${text}\n\n${pageUrl}` : text;

  if (posterDataUrl) {
    const shared = await shareImageNative(
      posterDataUrl,
      filename,
      caption,
      filename
    );
    if (shared === "shared") return "shared";
  }

  if (!isMobileDevice()) {
    const guided = posterDataUrl
      ? await prepareGuidedImageShare(posterDataUrl, filename, caption)
      : { mode: "guided" as const, captionCopied: await copyTextToClipboard(caption), imageCopied: false, downloaded: false };
    openWhatsAppShare(text, pageUrl);
    return {
      mode: "guided",
      imageCopied: guided.imageCopied,
      captionCopied: guided.captionCopied,
    };
  }

  if (posterDataUrl) {
    downloadDataUrl(posterDataUrl, filename);
  }
  openWhatsAppShare(text, pageUrl);
  return "opened";
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

/** Open the Facebook post composer (feed), not a group page. */
export function getFacebookComposerWebUrl() {
  return "https://www.facebook.com/";
}

export function getFacebookComposerAppUrl() {
  // Most reliable native scheme for the create-post screen.
  return "fb://publish/profile/me";
}

export function openFacebookComposer() {
  const webUrl = getFacebookComposerWebUrl();
  const appUrl = getFacebookComposerAppUrl();

  if (isAndroidDevice()) {
    // Android FB builds often ignore bare fb://composer; publish/profile works better.
    openMobileApp(appUrl, webUrl);
    return;
  }

  openMobileApp(appUrl, webUrl);
}

/**
 * Share poster + caption to Facebook via the system sheet.
 * Falls back to image-only if the device cannot share text with files.
 */
export async function sharePosterToFacebook(
  dataUrl: string,
  filename: string,
  caption: string
): Promise<"shared" | "cancelled" | "unsupported"> {
  if (!navigator.share) return "unsupported";

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: "image/png" });

  try {
    if (navigator.canShare?.({ files: [file], text: caption })) {
      await navigator.share({ files: [file], text: caption });
      return "shared";
    }
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return "shared";
    }
    return "unsupported";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}

/**
 * Share an image file only via the system sheet (Instagram and generic shares).
 */
export async function sharePosterImage(
  dataUrl: string,
  filename: string
): Promise<"shared" | "cancelled" | "unsupported"> {
  if (!navigator.share) return "unsupported";

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: "image/png" });

  try {
    if (!navigator.canShare?.({ files: [file] })) {
      return "unsupported";
    }
    await navigator.share({ files: [file] });
    return "shared";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}

export function openInstagram() {
  openMobileApp("instagram://app", "https://www.instagram.com/");
}

/** Share poster to Instagram. Desktop copies the image and opens instagram.com. */
export async function openInstagramPostFlow(
  posterDataUrl: string | null,
  filename: string,
  caption = ""
): Promise<SocialPostFlowResult> {
  if (posterDataUrl) {
    const shared = await sharePosterImage(posterDataUrl, filename);
    if (shared === "shared") return "shared";
    if (shared === "cancelled") return "cancelled";

    const native = await shareImageNative(
      posterDataUrl,
      filename,
      caption,
      filename
    );
    if (native === "shared") return "shared";
  }

  if (!isMobileDevice()) {
    const guided = posterDataUrl
      ? await prepareGuidedImageShare(posterDataUrl, filename, caption)
      : {
          mode: "guided" as const,
          captionCopied: false,
          imageCopied: false,
          downloaded: false,
        };
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    return {
      mode: "guided",
      imageCopied: guided.imageCopied,
      captionCopied: guided.captionCopied,
    };
  }

  if (posterDataUrl) {
    downloadDataUrl(posterDataUrl, filename);
  }
  openInstagram();
  return "opened";
}

/** Share poster to Facebook. Desktop copies the image and opens facebook.com. */
export async function openFacebookPostFlow(
  posterDataUrl: string | null,
  filename: string,
  caption: string,
  _facebookGroupUrl?: string | null
): Promise<SocialPostFlowResult> {
  if (posterDataUrl) {
    const shared = await sharePosterToFacebook(
      posterDataUrl,
      filename,
      caption
    );
    if (shared === "shared") return "shared";
    if (shared === "cancelled") return "cancelled";

    const native = await shareImageNative(
      posterDataUrl,
      filename,
      caption,
      filename
    );
    if (native === "shared") return "shared";
  }

  if (!isMobileDevice()) {
    const guided = posterDataUrl
      ? await prepareGuidedImageShare(posterDataUrl, filename, caption)
      : {
          mode: "guided" as const,
          captionCopied: await copyTextToClipboard(caption),
          imageCopied: false,
          downloaded: false,
        };
    openFacebookComposer();
    return {
      mode: "guided",
      imageCopied: guided.imageCopied,
      captionCopied: guided.captionCopied,
    };
  }

  if (posterDataUrl) {
    downloadDataUrl(posterDataUrl, filename);
  }
  openFacebookComposer();
  return "opened";
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
  text: string,
  filename = "event-frame.png"
): Promise<"shared" | "unsupported"> {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: "image/png" });

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

export type SocialPostResult = {
  mode: "guided";
  captionCopied: boolean;
  imageCopied: boolean;
  downloaded: boolean;
};

/** Download poster and copy caption/image for manual posting on desktop web apps. */
export async function prepareGuidedImageShare(
  dataUrl: string,
  filename: string,
  caption: string
): Promise<SocialPostResult> {
  downloadDataUrl(dataUrl, filename);
  const captionCopied = await copyTextToClipboard(caption);
  const imageCopied = isMobileDevice()
    ? false
    : await copyImageToClipboard(dataUrl);

  return {
    mode: "guided",
    captionCopied,
    imageCopied,
    downloaded: true,
  };
}

async function prepareSocialImagePost(
  dataUrl: string,
  filename: string,
  caption: string
): Promise<SocialPostResult> {
  return prepareGuidedImageShare(dataUrl, filename, caption);
}

export async function prepareInstagramPost(
  dataUrl: string,
  filename: string,
  caption: string
): Promise<SocialPostResult> {
  return prepareSocialImagePost(dataUrl, filename, caption);
}

/** Download poster and copy caption for manual Facebook posting. */
export async function prepareFacebookPost(
  dataUrl: string,
  filename: string,
  caption: string
): Promise<SocialPostResult> {
  return prepareSocialImagePost(dataUrl, filename, caption);
}
