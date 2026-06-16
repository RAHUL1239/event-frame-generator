"use client";

import {
  isMobileDevice,
  openFacebookPostFlow,
  type FacebookPostResult,
} from "@/lib/share";

type Props = {
  result: FacebookPostResult;
  caption: string;
  filename: string;
  posterDataUrl: string | null;
  facebookGroupName?: string | null;
  facebookGroupUrl?: string | null;
  onClose: () => void;
  primaryColor?: string;
};

export function FacebookPostGuide({
  result,
  caption,
  filename,
  posterDataUrl,
  facebookGroupName,
  facebookGroupUrl,
  onClose,
  primaryColor = "#1a4d4a",
}: Props) {
  if (result.mode === "native") {
    return null;
  }

  const groupLabel = facebookGroupName || "your Facebook group";
  const onDesktop = !isMobileDevice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold" style={{ color: primaryColor }}>
            How to post on Facebook
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
            ? "On Windows and Mac, Facebook is not available in the system share menu. Your poster has been downloaded and the caption copied — open Facebook in your browser to post."
            : "Facebook does not let websites upload photos or auto-tag groups. We have prepared your caption — follow these steps:"}
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
                Click <strong>Open Facebook in Browser</strong> below
                {facebookGroupName ? ` (${groupLabel})` : ""}
              </li>
              <li>
                Click <strong>&quot;Write something...&quot;</strong> in the group
              </li>
              <li>
                Paste your caption — press{" "}
                <kbd className="rounded bg-gray-200 px-1">Ctrl+V</kbd> (or{" "}
                <kbd className="rounded bg-gray-200 px-1">Cmd+V</kbd> on Mac)
              </li>
              <li>
                Click the <strong>Photo</strong> icon and select{" "}
                <strong>{filename}</strong> from Downloads
              </li>
              <li>
                Click <strong>Post</strong>
              </li>
            </>
          ) : (
            <>
              <li>
                Tap <strong>Share poster to Facebook</strong> below and choose{" "}
                <strong>Facebook</strong> from the share menu (image only — no
                link)
              </li>
              <li>
                Facebook should open with your poster attached — if not, tap the{" "}
                <strong>Photo</strong> icon and select <strong>{filename}</strong>{" "}
                from Downloads
              </li>
              <li>
                Long-press and <strong>paste</strong> your caption (already copied
                to clipboard)
              </li>
              {facebookGroupName ? (
                <li>
                  Type <strong>@</strong> and select{" "}
                  <strong>{facebookGroupName}</strong> to tag the group in your
                  post
                </li>
              ) : (
                <li>
                  Add your group name or link from the caption to tag your
                  community
                </li>
              )}
              <li>
                Tap <strong>Post</strong>
              </li>
            </>
          )}
        </ol>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() =>
              void openFacebookPostFlow(
                posterDataUrl,
                filename,
                facebookGroupUrl
              )
            }
            className="w-full rounded-xl py-3 font-semibold text-white"
            style={{ backgroundColor: "#1877F2" }}
          >
            {onDesktop ? "Open Facebook in Browser" : "Share poster to Facebook"}
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
