"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDisplayName } from "@/lib/utils";
import { loadPreviewAssets } from "@/lib/preview-storage";
import type { EventWithOptions } from "@/lib/types";
import {
  buildFacebookShareCaption,
  buildInstagramShareCaption,
  buildShareCaption,
  copyTextToClipboard,
  downloadDataUrl,
  getGuidedShareToastMessage,
  getPreviewPageUrl,
  getShareableInvitationUrl,
  isMobileDevice,
  openFacebookPostFlow,
  openInstagramPostFlow,
  openWhatsAppPostFlow,
  openWhatsAppShare,
  shareImageNative,
  type SocialPostFlowResult,
} from "@/lib/share";

const SHARE_TEAL = "#2EC4C8";
const SHARE_WHATSAPP = "#22C55E";
const SHARE_FACEBOOK = "#3B82F6";
const SHARE_INSTAGRAM = "#E11D74";

type Submission = {
  id: string;
  type: string;
  firstName: string | null;
  lastName: string | null;
  groupName: string | null;
  posterDataUrl: string | null;
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

  const invitationText = buildShareCaption(event);
  const invitationMessage = buildShareCaption(event, invitationUrl);
  const facebookShareText = buildFacebookShareCaption(event);
  const instagramShareText = buildInstagramShareCaption(event);

  useEffect(() => {
    const url = getShareableInvitationUrl(slug);
    setInvitationUrl(url);
    setOnLocalhost(!url && !!getPreviewPageUrl());

    if (!posterDataUrl) {
      const stored = loadPreviewAssets(submission.id);
      if (stored) {
        if (!posterDataUrl) setPosterDataUrl(stored.posterDataUrl);
      }
    }
  }, [slug, submission.id, posterDataUrl]);

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

  function showSocialShareResult(
    platform: "whatsapp" | "facebook" | "instagram",
    result: SocialPostFlowResult,
    mobileFallback: string
  ) {
    if (result === "shared") {
      if (platform === "facebook") showToast("Shared to Facebook!");
      return;
    }
    if (result === "cancelled") return;
    if (typeof result === "object" && result.mode === "guided") {
      showToast(getGuidedShareToastMessage(platform, result));
      return;
    }
    showToast(mobileFallback);
  }

  async function handleShareFacebook() {
    if (!posterDataUrl) {
      showToast("Poster not ready yet. Please wait or regenerate your frames.");
      return;
    }

    const filename = `${slug}-poster.png`;
    const result = await openFacebookPostFlow(
      posterDataUrl,
      filename,
      facebookShareText,
      event.facebookGroupUrl
    );

    showSocialShareResult(
      "facebook",
      result,
      "Facebook opened. Attach the downloaded poster and paste the copied caption."
    );
  }

  async function handleShareInstagramStory() {
    if (!posterDataUrl) {
      showToast("Poster not ready yet. Please wait or regenerate your frames.");
      return;
    }

    const filename = `${slug}-poster.png`;
    const result = await openInstagramPostFlow(
      posterDataUrl,
      filename,
      instagramShareText
    );

    showSocialShareResult(
      "instagram",
      result,
      "Instagram opened. Attach the downloaded poster to your story or post."
    );
  }

  async function handleShareWhatsApp() {
    if (!posterDataUrl) {
      openWhatsAppShare(invitationText, invitationUrl);
      return;
    }

    const filename = `${slug}-poster.png`;
    const result = await openWhatsAppPostFlow(
      posterDataUrl,
      filename,
      invitationText,
      invitationUrl
    );

    showSocialShareResult(
      "whatsapp",
      result,
      "WhatsApp opened with your invitation text. Attach the downloaded poster in the chat."
    );
  }

  async function handleShareMore() {
    if (!posterDataUrl) return;

    if (isMobileDevice()) {
      const result = await shareImageNative(
        posterDataUrl,
        `${event.name} - ${displayName}`,
        invitationMessage,
        `${slug}-poster.png`
      );
      if (result === "shared") return;
    }

    downloadDataUrl(posterDataUrl, `${slug}-poster.png`);
    showToast(
      "Image downloaded. Attach it in Instagram, Messages, or any app."
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-xl px-5 py-3 text-base text-white shadow-lg"
          style={{ backgroundColor: SHARE_TEAL }}
        >
          {toast}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={backPath}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Edit
        </Link>
      </div>

      <div className="mb-5 rounded-[1.75rem] border-2 border-brand-gold bg-[#f6ecd6] px-6 py-7 text-center shadow-sm">
        <p
          className="flex items-center justify-center gap-2 text-3xl font-bold leading-tight md:text-4xl"
          style={{ color: SHARE_TEAL }}
        >
          <span aria-hidden className="text-2xl md:text-3xl">
            🎉
          </span>
          You are participant
        </p>
        <p
          className="mt-1 text-4xl font-bold tracking-tight md:text-5xl"
          style={{ color: SHARE_TEAL }}
        >
          #{participantNumber.toLocaleString("en-US")}
        </p>
        <p className="mt-4 text-lg leading-relaxed text-gray-600 sm:text-xl">
          Share your poster and invite friends to join the celebration!
        </p>
      </div>

      <section className="mb-8 rounded-[1.75rem] bg-white px-6 py-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <h2 className="text-2xl font-bold" style={{ color: SHARE_TEAL }}>
          Share with friends
        </h2>
        <p className="mt-2 text-lg leading-relaxed text-gray-600 sm:text-xl">
          Share your poster and invite friends to create their own frame.
        </p>

        {onLocalhost && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-lg leading-relaxed text-amber-900 sm:text-xl">
            Running on localhost — invitation links are not included in shares.
            Use &quot;Share image&quot; on mobile or deploy to test link sharing.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <ShareButton
            label="Share to WhatsApp"
            color={SHARE_WHATSAPP}
            onClick={() => void handleShareWhatsApp()}
          />
          <ShareButton
            label="Share to Facebook"
            color={SHARE_FACEBOOK}
            onClick={() => void handleShareFacebook()}
          />
          <ShareButton
            label="Share to Instagram Story"
            color={SHARE_INSTAGRAM}
            onClick={() => void handleShareInstagramStory()}
          />
          <ShareButton
            label="Copy invitation link"
            color={SHARE_TEAL}
            onClick={() => void handleCopyInvitationLink()}
          />
        </div>
      </section>

      <div>
        <PreviewCard
          title="Social Media Poster"
          subtitle="For Instagram / Facebook / WhatsApp"
          dataUrl={posterDataUrl}
          accentColor={event.accentColor}
          primaryColor={event.primaryColor}
          previewBackground={event.primaryColor}
          onDownload={() =>
            posterDataUrl &&
            downloadDataUrl(posterDataUrl, `${slug}-poster.png`)
          }
          onShareMore={() => void handleShareMore()}
        />
      </div>

    </div>
  );
}

function ShareButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full px-6 py-3.5 text-center text-lg font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99]"
      style={{ backgroundColor: color }}
    >
      {label}
    </button>
  );
}

function PreviewCard({
  title,
  subtitle,
  dataUrl,
  accentColor,
  primaryColor,
  previewBackground,
  onDownload,
  onShareMore,
}: {
  title: string;
  subtitle: string;
  dataUrl: string | null;
  accentColor: string;
  primaryColor: string;
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
        <h3 className="text-xl font-bold" style={{ color: primaryColor }}>
          {title}
        </h3>
        <p className="text-lg leading-relaxed opacity-80 sm:text-xl" style={{ color: primaryColor }}>
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
          className="rounded-xl border-2 py-3 text-base font-semibold transition hover:bg-gray-50"
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Share image
        </button>
        <p className="text-center text-lg leading-relaxed text-gray-500 sm:text-xl">
          Use the share buttons above, or download to save a copy.
        </p>
      </div>
    </div>
  );
}
