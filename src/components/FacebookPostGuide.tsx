"use client";

import { openFacebook, type FacebookPostResult } from "@/lib/share";

type Props = {
  result: FacebookPostResult;
  caption: string;
  filename: string;
  onClose: () => void;
  primaryColor?: string;
};

export function FacebookPostGuide({
  result,
  caption,
  filename,
  onClose,
  primaryColor = "#1a4d4a",
}: Props) {
  if (result.mode === "native") {
    return null;
  }

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
          Facebook does not let websites upload photos or pre-fill posts. We
          have prepared everything for you — follow these steps:
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
          <p className="mt-1 italic">&quot;{caption}&quot;</p>
        </div>

        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-gray-700">
          <li>
            Click <strong>Open Facebook</strong> below
          </li>
          <li>
            Click <strong>&quot;What&apos;s on your mind?&quot;</strong> to
            create a post
          </li>
          <li>
            Paste your caption — press{" "}
            <kbd className="rounded bg-gray-200 px-1">Ctrl+V</kbd> (or{" "}
            <kbd className="rounded bg-gray-200 px-1">Cmd+V</kbd> on Mac)
          </li>
          <li>
            Click the green <strong>Photo/Video</strong> icon at the bottom
          </li>
          <li>
            Select <strong>{filename}</strong> from your Downloads folder
          </li>
          <li>
            Click <strong>Share</strong>
          </li>
        </ol>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              openFacebook();
            }}
            className="w-full rounded-xl py-3 font-semibold text-white"
            style={{ backgroundColor: "#1877F2" }}
          >
            Open Facebook
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
