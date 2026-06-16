"use client";

import {
  isMobileDevice,
  openInstagramPostFlow,
  type SocialPostResult,
} from "@/lib/share";

type Props = {
  result: SocialPostResult;
  caption: string;
  filename: string;
  posterDataUrl: string | null;
  onClose: () => void;
  primaryColor?: string;
};

export function InstagramPostGuide({
  result,
  caption,
  filename,
  posterDataUrl,
  onClose,
  primaryColor = "#1a4d4a",
}: Props) {
  const onDesktop = !isMobileDevice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold" style={{ color: primaryColor }}>
            How to post on Instagram
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-600">
          {onDesktop
            ? "Your poster has been downloaded and the caption copied. Open Instagram on your phone or upload from instagram.com on desktop."
            : "Instagram does not let websites upload photos directly. We have prepared your poster — follow these steps:"}
        </p>

        <ul className="mt-4 space-y-2 text-sm">
          {result.downloaded && (
            <li className="flex gap-2 text-green-700">
              <span>✓</span>
              <span>
                Poster saved as <strong>{filename}</strong> (check Downloads)
              </span>
            </li>
          )}
          {result.captionCopied && (
            <li className="flex gap-2 text-green-700">
              <span>✓</span>
              <span>Caption copied to clipboard</span>
            </li>
          )}
          {result.imageCopied && (
            <li className="flex gap-2 text-green-700">
              <span>✓</span>
              <span>Image copied — you can try pasting it directly (Ctrl+V)</span>
            </li>
          )}
        </ul>

        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          <p className="font-medium">Your caption:</p>
          <p className="mt-1 whitespace-pre-line italic">&quot;{caption}&quot;</p>
        </div>

        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-gray-700">
          {onDesktop ? (
            <>
              <li>
                Open <strong>instagram.com</strong> and sign in, or use the
                Instagram app on your phone
              </li>
              <li>
                Start a new post and upload <strong>{filename}</strong> from
                Downloads
              </li>
              <li>
                Paste your caption — press{" "}
                <kbd className="rounded bg-gray-200 px-1">Ctrl+V</kbd> (or{" "}
                <kbd className="rounded bg-gray-200 px-1">Cmd+V</kbd> on Mac)
              </li>
              <li>
                Tap <strong>Share</strong>
              </li>
            </>
          ) : (
            <>
              <li>
                Tap <strong>Share poster to Instagram</strong> below and choose{" "}
                <strong>Instagram</strong> from the share menu
              </li>
              <li>
                Choose <strong>Feed</strong> or <strong>Story</strong> in
                Instagram
              </li>
              <li>
                If the image is not attached, tap <strong>+</strong> and select{" "}
                <strong>{filename}</strong> from Downloads
              </li>
              <li>
                Long-press and <strong>paste</strong> your caption (already copied
                to clipboard)
              </li>
              <li>
                Tap <strong>Share</strong>
              </li>
            </>
          )}
        </ol>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() =>
              void openInstagramPostFlow(posterDataUrl, filename)
            }
            className="w-full rounded-xl py-3 font-semibold text-white"
            style={{
              background:
                "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
            }}
          >
            {onDesktop ? "Open Instagram" : "Share poster to Instagram"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
