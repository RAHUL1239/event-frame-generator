"use client";

import { useState, type MouseEvent } from "react";
import {
  buildShareCaption,
  copyTextToClipboard,
} from "@/lib/share";

const SHARE_TEAL = "#2EC4C8";
const SHARE_WHATSAPP = "#22C55E";
const SHARE_FACEBOOK = "#3B82F6";
const SHARE_INSTAGRAM = "#E11D74";
const EXAMPLE_PARTICIPANT = 1052;
const TRY_OUT_EVENT = { name: "Try Out", dateLabel: "Anytime" };

export function HomepageSharePreview({
  invitationUrl,
  whatsappHref,
  facebookHref,
  instagramHref,
}: {
  invitationUrl: string;
  whatsappHref: string;
  facebookHref: string;
  instagramHref: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopyInvitationLink(
    event: MouseEvent<HTMLAnchorElement>
  ) {
    event.preventDefault();
    const copiedOk = await copyTextToClipboard(
      buildShareCaption(TRY_OUT_EVENT, invitationUrl)
    );
    if (copiedOk) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <figure className="text-center">
      <div className="rounded-2xl bg-brand-cream p-3 shadow-lg ring-1 ring-black/5 sm:p-4">
        <div className="rounded-[1.35rem] border-2 border-brand-gold bg-[#f6ecd6] px-4 py-5 text-center shadow-sm">
          <p
            className="flex items-center justify-center gap-1.5 text-lg font-bold leading-tight sm:text-xl"
            style={{ color: SHARE_TEAL }}
          >
            <span aria-hidden className="text-xl">
              🎉
            </span>
            You are participant
          </p>
          <p
            className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: SHARE_TEAL }}
          >
            #{EXAMPLE_PARTICIPANT.toLocaleString("en-US")}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-gray-600 sm:text-sm">
            Share your poster and invite friends to join the celebration!
          </p>
        </div>

        <section className="mt-3 rounded-[1.35rem] bg-white px-4 py-5 text-left shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-bold" style={{ color: SHARE_TEAL }}>
            Share with friends
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-600 sm:text-sm">
            Share your poster and invite friends to create their own frame.
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            <ShareLink
              href={whatsappHref}
              label="Share to WhatsApp"
              color={SHARE_WHATSAPP}
            />
            <ShareLink
              href={facebookHref}
              label="Share to Facebook"
              color={SHARE_FACEBOOK}
            />
            <ShareLink
              href={instagramHref}
              label="Share to Instagram Story"
              color={SHARE_INSTAGRAM}
            />
            <ShareLink
              href={invitationUrl}
              label={copied ? "Invitation link copied" : "Copy invitation link"}
              color={SHARE_TEAL}
              onClick={handleCopyInvitationLink}
            />
          </div>
        </section>
      </div>
      <figcaption className="mt-4">
        <p className="text-sm font-semibold text-gray-900">Then they share it</p>
        <p className="mt-1 text-sm text-gray-500">
          WhatsApp · Facebook · Instagram · Copy link
        </p>
      </figcaption>
    </figure>
  );
}

function ShareLink({
  href,
  label,
  color,
  onClick,
}: {
  href: string;
  label: string;
  color: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      target={onClick ? undefined : "_blank"}
      rel={onClick ? undefined : "noopener noreferrer"}
      className="block w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99] sm:py-3 sm:text-base"
      style={{ backgroundColor: color }}
    >
      {label}
    </a>
  );
}
