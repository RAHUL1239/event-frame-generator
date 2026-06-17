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
            How to post to Instagram Story
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
          Instagram Stories cannot be posted directly from a website. Your poster
          has been saved — follow these steps in the Instagram app.
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
          <p className="font-medium">Optional caption for a text sticker:</p>
          <p className="mt-1 whitespace-pre-line italic">&quot;{caption}&quot;</p>
        </div>

        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-gray-700">
          {onDesktop ? (
            <>
              <li>
                Open the <strong>Instagram app</strong> on your phone (Stories
                are mobile-only)
              </li>
              <li>
                AirDrop or transfer <strong>{filename}</strong> to your phone if
                needed
              </li>
              <li>
                Tap <strong>Your story</strong> or swipe right from the feed
              </li>
              <li>
                Select <strong>{filename}</strong> from your photo gallery
              </li>
              <li>
                Add a text sticker and paste your caption if you like, then tap{" "}
                <strong>Share to story</strong>
              </li>
            </>
          ) : (
            <>
              <li>
                Open the <strong>Instagram</strong> app
              </li>
              <li>
                Tap <strong>Your story</strong> or swipe right from the feed
              </li>
              <li>
                Choose <strong>{filename}</strong> from your gallery (Downloads
                or Photos)
              </li>
              <li>
                Pinch or drag to fit the poster on screen
              </li>
              <li>
                Tap the <strong>Aa</strong> text tool, paste your caption if
                desired, then tap <strong>Your story</strong>
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
            {onDesktop ? "Open Instagram" : "Open Instagram app"}
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
