"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FacebookPostGuide } from "@/components/FacebookPostGuide";
import { formatDisplayName } from "@/lib/utils";
import { loadPreviewAssets } from "@/lib/preview-storage";
import type { EventWithOptions } from "@/lib/types";
import {
  buildShareCaption,
  copyTextToClipboard,
  downloadDataUrl,
  getPreviewPageUrl,
  getShareablePageUrl,
  isMobileDevice,
  openFacebook,
  openTwitterShare,
  openWhatsAppShare,
  prepareFacebookPost,
  shareImageNative,
  type FacebookPostResult,
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
}: {
  submission: Submission;
  slug: string;
  backPath: string;
}) {
  const event = submission.event;
  const displayName =
    formatDisplayName(submission.firstName, submission.lastName) ||
    submission.groupName ||
    "Guest";
  const [shareableUrl, setShareableUrl] = useState<string | undefined>();
  const [onLocalhost, setOnLocalhost] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [posterDataUrl, setPosterDataUrl] = useState(submission.posterDataUrl);
  const [dpDataUrl, setDpDataUrl] = useState(submission.dpDataUrl);
  const [facebookGuide, setFacebookGuide] = useState<{
    result: FacebookPostResult;
    filename: string;
  } | null>(null);

  const shareTextNoUrl = buildShareCaption(event);
  const shareText = buildShareCaption(event, shareableUrl);

  useEffect(() => {
    const url = getShareablePageUrl();
    setShareableUrl(url);
    setOnLocalhost(!url && !!getPreviewPageUrl());

    if (!posterDataUrl || !dpDataUrl) {
      const stored = loadPreviewAssets(submission.id);
      if (stored) {
        if (!posterDataUrl) setPosterDataUrl(stored.posterDataUrl);
        if (!dpDataUrl) setDpDataUrl(stored.dpDataUrl);
      }
    }
  }, [submission.id, posterDataUrl, dpDataUrl]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 5000);
  }

  async function handleCopyLink() {
    const pageUrl = getShareablePageUrl();
    if (!pageUrl) {
      const copied = await copyTextToClipboard(shareText);
      showToast(
        copied
          ? "Caption copied (no public link on localhost). Download your poster to share the image."
          : "Could not copy. Download your poster and share the image directly."
      );
      return;
    }
    const copied = await copyTextToClipboard(shareText);
    showToast(
      copied
        ? "Link copied! Paste it in a message to share with friends."
        : "Could not copy link. Please copy the URL from your browser."
    );
  }

  async function handlePostToFacebook() {
    if (!posterDataUrl) {
      showToast("Poster not ready yet. Please wait or regenerate your frames.");
      return;
    }

    const filename = `${slug}-poster.png`;
    const result = await prepareFacebookPost(
      posterDataUrl,
      filename,
      shareText,
      event.facebookGroupUrl,
      event.facebookGroupName
    );

    if (isMobileDevice()) {
      openFacebook(event.facebookGroupUrl);
    }

    setFacebookGuide({ result, filename });
  }

  function handleShareTwitter() {
    openTwitterShare(shareTextNoUrl, shareableUrl);
  }

  function handleShareWhatsApp() {
    openWhatsAppShare(shareTextNoUrl, shareableUrl);
  }

  async function handleShareMore(imageType: "poster" | "dp") {
    const dataUrl = imageType === "poster" ? posterDataUrl : dpDataUrl;
    if (!dataUrl) return;

    if (isMobileDevice()) {
      const result = await shareImageNative(
        dataUrl,
        `${event.name} - ${displayName}`,
        shareText,
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

      {facebookGuide && (
        <FacebookPostGuide
          result={facebookGuide.result}
          caption={shareText}
          filename={facebookGuide.filename}
          facebookGroupName={event.facebookGroupName}
          facebookGroupUrl={event.facebookGroupUrl}
          onClose={() => setFacebookGuide(null)}
          primaryColor={event.primaryColor}
        />
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={backPath}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Edit
        </Link>
      </div>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
        <h2
          className="text-lg font-bold"
          style={{ color: event.primaryColor }}
        >
          Share with friends
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          For Facebook, the social media poster is downloaded (not the WhatsApp
          DP). Paste the caption and attach the poster from your Downloads folder.
        </p>

        {onLocalhost && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Running on localhost — preview links are not included in shares.
            Download your poster or use &quot;Share image&quot; so friends get
            the picture, not a broken link.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <ShareButton
            label="Post to Facebook"
            sublabel="Download + instructions"
            color="#1877F2"
            onClick={handlePostToFacebook}
          />
          <ShareButton
            label="WhatsApp"
            sublabel="Send to contacts"
            color="#25D366"
            onClick={handleShareWhatsApp}
          />
          <ShareButton
            label="X / Twitter"
            sublabel="Post update"
            color="#000000"
            onClick={handleShareTwitter}
          />
          <ShareButton
            label="Copy link"
            sublabel="Share with anyone"
            color={event.primaryColor}
            onClick={handleCopyLink}
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
          onDownload={() =>
            posterDataUrl &&
            downloadDataUrl(posterDataUrl, `${slug}-poster.png`)
          }
          onPostFacebook={handlePostToFacebook}
          onShareMore={() => handleShareMore("poster")}
        />
        <PreviewCard
          title="WhatsApp DP"
          subtitle="Circular crop with event ring"
          dataUrl={dpDataUrl}
          accentColor={event.accentColor}
          primaryColor={event.primaryColor}
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
  sublabel: string;
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
      <span className="text-xs opacity-80">{sublabel}</span>
    </button>
  );
}

function PreviewCard({
  title,
  subtitle,
  dataUrl,
  accentColor,
  primaryColor,
  onDownload,
  onPostFacebook,
  onShareMore,
}: {
  title: string;
  subtitle: string;
  dataUrl: string | null;
  accentColor: string;
  primaryColor: string;
  onDownload: () => void;
  onPostFacebook?: () => void;
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
      <div className="flex justify-center bg-gray-100 p-6">
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
        <div className={`grid gap-2 ${onPostFacebook ? "grid-cols-2" : "grid-cols-1"}`}>
          {onPostFacebook && (
            <button
              type="button"
              onClick={onPostFacebook}
              className="rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#1877F2" }}
            >
              Post to Facebook
            </button>
          )}
          <button
            type="button"
            onClick={onShareMore}
            className="rounded-xl border-2 py-3 text-sm font-semibold transition hover:bg-gray-50"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            Share image
          </button>
        </div>
        <p className="text-center text-xs text-gray-500">
          Facebook: download poster, then upload via Photo/Video button.
        </p>
      </div>
    </div>
  );
}
