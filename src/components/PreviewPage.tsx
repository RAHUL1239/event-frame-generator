"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EventHighlightsList } from "@/components/EventHighlightsList";
import { formatDisplayName } from "@/lib/utils";
import { loadPreviewAssets } from "@/lib/preview-storage";
import type { EventWithOptions } from "@/lib/types";
import {
  buildFacebookShareCaption,
  buildInstagramShareCaption,
  buildShareCaption,
  copyTextToClipboard,
  downloadDataUrl,
  getPreviewPageUrl,
  getShareableInvitationUrl,
  isMobileDevice,
  openFacebook,
  openFacebookPostFlow,
  openInstagramPostFlow,
  openWhatsAppShare,
  prepareInstagramPost,
  prepareFacebookPost,
  shareImageNative,
} from "@/lib/share";

type Submission = {
  id: string;
  type: string;
  firstName: string | null;
  lastName: string | null;
  groupName: string | null;
  posterDataUrl: string | null;
  dpDataUrl: string | null;
  event: EventWithOptions;
};

export function PreviewPage({
  submission,
  slug,
  backPath,
  participantNumber,
}: {
  submission: Submission;
  slug: string;
  backPath: string;
  participantNumber: number;
}) {
  const event = submission.event;
  const displayName =
    formatDisplayName(submission.firstName, submission.lastName) ||
    submission.groupName ||
    "Guest";
  const [invitationUrl, setInvitationUrl] = useState<string | undefined>();
  const [onLocalhost, setOnLocalhost] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [posterDataUrl, setPosterDataUrl] = useState(submission.posterDataUrl);
  const [dpDataUrl, setDpDataUrl] = useState(submission.dpDataUrl);

  const invitationText = buildShareCaption(event);
  const invitationMessage = buildShareCaption(event, invitationUrl);
  const facebookShareText = buildFacebookShareCaption(event);
  const instagramShareText = buildInstagramShareCaption(event);

  useEffect(() => {
    const url = getShareableInvitationUrl(slug);
    setInvitationUrl(url);
    setOnLocalhost(!url && !!getPreviewPageUrl());

    if (!posterDataUrl || !dpDataUrl) {
      const stored = loadPreviewAssets(submission.id);
      if (stored) {
        if (!posterDataUrl) setPosterDataUrl(stored.posterDataUrl);
        if (!dpDataUrl) setDpDataUrl(stored.dpDataUrl);
      }
    }
  }, [slug, submission.id, posterDataUrl, dpDataUrl]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 5000);
  }

  async function handleCopyInvitationLink() {
    if (!invitationUrl) {
      const copied = await copyTextToClipboard(invitationText);
      showToast(
        copied
          ? "Invitation text copied (no public link on localhost)."
          : "Could not copy. Try again or share from your phone."
      );
      return;
    }
    const copied = await copyTextToClipboard(invitationMessage);
    showToast(
      copied
        ? "Invitation link copied! Paste it in a message to invite friends."
        : "Could not copy link. Please copy the URL from your browser."
    );
  }

  async function handleShareFacebook() {
    if (!posterDataUrl) {
      showToast("Poster not ready yet. Please wait or regenerate your frames.");
      return;
    }

    const filename = `${slug}-poster.png`;
    const direct = await openFacebookPostFlow(
      posterDataUrl,
      filename,
      facebookShareText,
      event.facebookGroupUrl
    );

    if (direct === "shared") {
      showToast("Shared to Facebook!");
      return;
    }
    if (direct === "cancelled") return;

    await prepareFacebookPost(posterDataUrl, filename, facebookShareText);
    openFacebook(event.facebookGroupUrl);
    showToast("Poster downloaded and caption copied. Open Facebook to post.");
  }

  async function handleShareInstagramStory() {
    if (!posterDataUrl) {
      showToast("Poster not ready yet. Please wait or regenerate your frames.");
      return;
    }

    const filename = `${slug}-poster.png`;
    const direct = await openInstagramPostFlow(posterDataUrl, filename);

    if (direct === "opened") {
      await prepareInstagramPost(posterDataUrl, filename, instagramShareText);
      showToast("Poster downloaded. Open Instagram to share to your story.");
    }
  }

  async function handleShareWhatsApp() {
    if (posterDataUrl && isMobileDevice()) {
      const shared = await shareImageNative(
        posterDataUrl,
        event.name,
        invitationMessage,
        `${slug}-poster.png`
      );
      if (shared === "shared") return;
    }

    openWhatsAppShare(invitationText, invitationUrl);
  }

  async function handleShareMore(imageType: "poster" | "dp") {
    const dataUrl = imageType === "poster" ? posterDataUrl : dpDataUrl;
    if (!dataUrl) return;

    if (isMobileDevice()) {
      const result = await shareImageNative(
        dataUrl,
        `${event.name} - ${displayName}`,
        invitationMessage,
        `${slug}-${imageType}.png`
      );
      if (result === "shared") return;
    }

    downloadDataUrl(dataUrl, `${slug}-${imageType}.png`);
    showToast(
      "Image downloaded. Attach it in Instagram, Messages, or any app."
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-xl px-5 py-3 text-sm text-white shadow-lg"
          style={{ backgroundColor: event.primaryColor }}
        >
          {toast}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={backPath}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Edit
        </Link>
      </div>

      <div
        className="mb-6 rounded-2xl px-6 py-5 text-center shadow-lg"
        style={{
          backgroundColor: `${event.accentColor}18`,
          borderColor: event.accentColor,
          borderWidth: 2,
        }}
      >
        <p
          className="text-2xl font-bold md:text-3xl"
          style={{ color: event.primaryColor }}
        >
          🎉 You are participant #{participantNumber.toLocaleString()}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Share your poster and invite friends to join the celebration!
        </p>
      </div>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
        <h2
          className="text-lg font-bold"
          style={{ color: event.primaryColor }}
        >
          Share with friends
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Share your poster and invite friends to create their own frame. The
          WhatsApp DP below is for profile photos only.
        </p>

        {onLocalhost && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Running on localhost — invitation links are not included in shares.
            Use &quot;Share image&quot; on mobile or deploy to test link sharing.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <ShareButton
            label="Share to WhatsApp"
            color="#25D366"
            onClick={() => void handleShareWhatsApp()}
          />
          <ShareButton
            label="Share to Facebook"
            color="#1877F2"
            onClick={() => void handleShareFacebook()}
          />
          <ShareButton
            label="Share to Instagram Story"
            color="#E1306C"
            onClick={() => void handleShareInstagramStory()}
          />
          <ShareButton
            label="Copy invitation link"
            color={event.primaryColor}
            onClick={() => void handleCopyInvitationLink()}
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <PreviewCard
          title="Social Media Poster"
          subtitle="For Instagram / Facebook"
          dataUrl={posterDataUrl}
          accentColor={event.accentColor}
          primaryColor={event.primaryColor}
          highlights={event.eventHighlights}
          onDownload={() =>
            posterDataUrl &&
            downloadDataUrl(posterDataUrl, `${slug}-poster.png`)
          }
          onShareMore={() => handleShareMore("poster")}
        />
        <PreviewCard
          title="WhatsApp DP"
          subtitle="Circular crop with event ring"
          dataUrl={dpDataUrl}
          accentColor={event.accentColor}
          primaryColor={event.primaryColor}
          previewBackground={event.primaryColor}
          onDownload={() =>
            dpDataUrl && downloadDataUrl(dpDataUrl, `${slug}-dp.png`)
          }
          onShareMore={() => handleShareMore("dp")}
        />
      </div>

    </div>
  );
}

function ShareButton({
  label,
  sublabel,
  color,
  onClick,
}: {
  label: string;
  sublabel?: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[130px] flex-col items-start rounded-xl px-4 py-3 text-left text-white transition hover:opacity-90"
      style={{ backgroundColor: color }}
    >
      <span className="text-sm font-bold">{label}</span>
      {sublabel && <span className="text-xs opacity-80">{sublabel}</span>}
    </button>
  );
}

function PreviewCard({
  title,
  subtitle,
  dataUrl,
  accentColor,
  primaryColor,
  highlights,
  previewBackground,
  onDownload,
  onShareMore,
}: {
  title: string;
  subtitle: string;
  dataUrl: string | null;
  accentColor: string;
  primaryColor: string;
  highlights?: string | null;
  previewBackground?: string;
  onDownload: () => void;
  onShareMore: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
      <div
        className="px-6 py-4 text-white"
        style={{ backgroundColor: accentColor }}
      >
        <h3 className="text-lg font-bold" style={{ color: primaryColor }}>
          {title}
        </h3>
        <p className="text-sm opacity-80" style={{ color: primaryColor }}>
          {subtitle}
        </p>
      </div>
      <div
        className="flex justify-center p-6"
        style={{ backgroundColor: previewBackground ?? "#f3f4f6" }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={title}
            className="max-h-[400px] rounded-lg shadow-md"
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center text-gray-400">
            No preview
          </div>
        )}
      </div>
      {highlights && (
        <div className="border-t bg-white px-6 py-4">
          <EventHighlightsList
            highlights={highlights}
            primaryColor={primaryColor}
            accentColor={accentColor}
          />
        </div>
      )}
      <div className="space-y-2 border-t p-4">
        <button
          type="button"
          onClick={onDownload}
          className="w-full rounded-xl py-3 font-semibold transition hover:opacity-90"
          style={{ backgroundColor: accentColor, color: primaryColor }}
        >
          Download PNG
        </button>
        <button
          type="button"
          onClick={onShareMore}
          className="rounded-xl border-2 py-3 text-sm font-semibold transition hover:bg-gray-50"
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Share image
        </button>
        <p className="text-center text-xs text-gray-500">
          Use the share buttons above, or download to save a copy.
        </p>
      </div>
    </div>
  );
}
