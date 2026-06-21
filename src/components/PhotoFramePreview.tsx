"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PERSONAL_PHOTO_POSITION,
  renderPersonalPosterCanvas,
} from "@/lib/image-generator";
import {
  DEFAULT_PHOTO_CROP,
  type PhotoCrop,
} from "@/lib/photo-crop";
import type { EventWithOptions } from "@/lib/types";
import { loadImage } from "@/lib/utils";

type Props = {
  event: EventWithOptions;
  frameThemeKey?: string;
  firstName: string;
  lastName: string;
  src: string;
  crop?: PhotoCrop;
  onCropChange?: (crop: PhotoCrop) => void;
};

export function PhotoFramePreview({
  event,
  frameThemeKey,
  firstName,
  lastName,
  src,
  crop = DEFAULT_PHOTO_CROP,
  onCropChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [rendering, setRendering] = useState(true);
  const interactive = Boolean(onCropChange);

  const renderPreview = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRendering(true);
    try {
      const photo = await loadImage(src);
      await renderPersonalPosterCanvas(
        canvas,
        {
          event,
          firstName,
          lastName,
          photoCrop: crop,
          frameThemeKey,
        },
        photo
      );
    } catch {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } finally {
      setRendering(false);
    }
  }, [event, firstName, lastName, src, crop, frameThemeKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void renderPreview();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [renderPreview]);

  function canvasPointFromEvent(
    e: React.PointerEvent
  ): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function isOnPhoto(point: { x: number; y: number }) {
    const { x, y, radius, ringPadding } = PERSONAL_PHOTO_POSITION;
    const dx = point.x - x;
    const dy = point.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= radius + ringPadding + 12;
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!onCropChange) return;

    const point = canvasPointFromEvent(e);
    if (!point || !isOnPhoto(point)) return;

    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current || !onCropChange) return;

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.004;
    onCropChange({
      ...crop,
      offsetX: clamp(crop.offsetX + dx * sensitivity, -1, 1),
      offsetY: clamp(crop.offsetY + dy * sensitivity, -1, 1),
    });
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto w-full max-w-md">
        <canvas
          ref={canvasRef}
          width={1080}
          height={1080}
          className={`block w-full rounded-lg shadow-md ${
            interactive ? "cursor-grab touch-none active:cursor-grabbing" : ""
          }`}
          style={{ height: "auto" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {rendering && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-white/60">
            <p className="text-sm text-gray-500">Updating preview…</p>
          </div>
        )}
      </div>

      {interactive && (
        <div className="mx-auto max-w-md space-y-3">
          <p className="text-center text-xs text-gray-500">
            Drag your photo to reposition · preview matches your final frame
          </p>
          <div>
            <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500">
              <span>Zoom</span>
              <span>{Math.round(crop.scale * 100)}%</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.05}
              value={crop.scale}
              onChange={(e) =>
                onCropChange?.({ ...crop, scale: Number(e.target.value) })
              }
              className="w-full accent-brand-teal"
            />
          </div>
          <button
            type="button"
            onClick={() => onCropChange?.(DEFAULT_PHOTO_CROP)}
            className="text-xs text-gray-500 underline hover:text-gray-700"
          >
            Reset position
          </button>
        </div>
      )}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
