"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getGroupPosterPhotoPositions,
  renderGroupPosterCanvas,
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
  groupName: string;
  memberCount: 2 | 3 | 4;
  photoSrcs: string[];
  photoCrops: PhotoCrop[];
  onCropChange: (index: number, crop: PhotoCrop) => void;
};

const RING_PADDING = 5;

export function GroupFramePreview({
  event,
  frameThemeKey,
  groupName,
  memberCount,
  photoSrcs,
  photoCrops,
  onCropChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const activeIndex = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });
  const [rendering, setRendering] = useState(true);

  const renderPreview = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRendering(true);
    try {
      const photos = await Promise.all(photoSrcs.map((src) => loadImage(src)));
      await renderGroupPosterCanvas(
        canvas,
        {
          event,
          groupName,
          memberCount,
          photoCrops,
          frameThemeKey,
        },
        photos
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
  }, [event, frameThemeKey, groupName, memberCount, photoSrcs, photoCrops]);

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

  function findPhotoIndexAtPoint(point: { x: number; y: number }) {
    const positions = getGroupPosterPhotoPositions(memberCount);
    for (let i = positions.length - 1; i >= 0; i--) {
      const { x, y, r } = positions[i];
      const dx = point.x - x;
      const dy = point.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= r + RING_PADDING + 12) {
        return i;
      }
    }
    return null;
  }

  function handlePointerDown(e: React.PointerEvent) {
    const point = canvasPointFromEvent(e);
    if (!point) return;

    const index = findPhotoIndexAtPoint(point);
    if (index === null) return;

    activeIndex.current = index;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;

    const index = activeIndex.current;
    const crop = photoCrops[index] ?? DEFAULT_PHOTO_CROP;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.004;
    onCropChange(index, {
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
          className="block w-full cursor-grab touch-none rounded-lg shadow-md active:cursor-grabbing"
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

      <div className="mx-auto max-w-md space-y-4">
        <p className="text-center text-xs text-gray-500">
          Drag a member photo in the preview to reposition · matches your final
          frame
        </p>
        {Array.from({ length: memberCount }).map((_, index) => {
          const crop = photoCrops[index] ?? DEFAULT_PHOTO_CROP;
          return (
            <div key={index} className="space-y-2">
              <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500">
                <span>Zoom · Member {index + 1}</span>
                <span>{Math.round(crop.scale * 100)}%</span>
              </label>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.05}
                value={crop.scale}
                onChange={(e) =>
                  onCropChange(index, {
                    ...crop,
                    scale: Number(e.target.value),
                  })
                }
                className="w-full accent-brand-teal"
              />
              <button
                type="button"
                onClick={() => onCropChange(index, DEFAULT_PHOTO_CROP)}
                className="text-xs text-gray-500 underline hover:text-gray-700"
              >
                Reset member {index + 1} position
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
