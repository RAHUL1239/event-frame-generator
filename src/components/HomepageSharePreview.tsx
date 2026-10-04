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
      <div className="flex h-full flex-col justify-end rounded-2xl bg-brand-cream p-3 shadow-lg ring-1 ring-black/5 sm:p-4">
        <section className="rounded-[1.35rem] bg-white px-4 py-4 text-left shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <h3 className="text-xl font-bold" style={{ color: SHARE_TEAL }}>
            Share with friends
          </h3>
          <div className="mt-3 flex flex-col gap-2.5">
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
      <figcaption className="mt-3">
        <p className="text-lg font-semibold leading-relaxed text-gray-900 sm:text-xl">Then they share it</p>
        <p className="mt-1 text-lg leading-relaxed text-gray-500 sm:text-xl">
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
      className="block w-full rounded-full px-4 py-2.5 text-center text-base font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99]"
      style={{ backgroundColor: color }}
    >
      {label}
    </a>
  );
}
