"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_PHOTO_CROP,
  getSmartDefaultCrop,
  type PhotoCrop,
} from "@/lib/photo-crop";
import { drawCircularImage, loadImage } from "@/lib/utils";

type Props = {
  src: string;
  crop: PhotoCrop;
  onCropChange: (crop: PhotoCrop) => void;
  accentColor?: string;
  label?: string;
};

export function PhotoCropEditor({
  src,
  crop,
  onCropChange,
  accentColor = "#c9a227",
  label,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);

  const previewSize = 192;
  const radius = previewSize / 2 - 4;

  const drawPreview = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const img = await loadImage(src);
      canvas.width = previewSize;
      canvas.height = previewSize;

      ctx.fillStyle = "#ebe4d8";
      ctx.fillRect(0, 0, previewSize, previewSize);

      drawCircularImage(ctx, img, previewSize / 2, previewSize / 2, radius, crop);

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(previewSize / 2, previewSize / 2, radius + 1, 0, Math.PI * 2);
      ctx.stroke();

      setLoaded(true);
    } catch {
      setLoaded(false);
    }
  }, [src, crop, accentColor, radius]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  function handlePointerDown(e: React.PointerEvent) {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;

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
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-xs font-medium text-gray-500">{label}</p>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0 text-center">
          <canvas
            ref={canvasRef}
            width={previewSize}
            height={previewSize}
            className="cursor-grab touch-none rounded-full active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          <p className="mt-2 text-xs text-gray-500">
            Drag to reposition · matches final frame
          </p>
        </div>

        <div className="w-full min-w-0 flex-1 space-y-3">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Original"
              className="max-h-32 w-full object-contain"
            />
          </div>
          <p className="text-xs text-gray-500">Original photo (not cropped)</p>

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
                onCropChange({ ...crop, scale: Number(e.target.value) })
              }
              className="w-full accent-brand-teal"
            />
          </div>

          <button
            type="button"
            onClick={() => onCropChange(DEFAULT_PHOTO_CROP)}
            className="text-xs text-gray-500 underline hover:text-gray-700"
          >
            Reset position
          </button>
        </div>
      </div>

      {!loaded && (
        <p className="text-xs text-gray-400">Loading preview…</p>
      )}
    </div>
  );
}

export function usePhotoCrop(src: string | null) {
  const [crop, setCrop] = useState<PhotoCrop>(DEFAULT_PHOTO_CROP);

  useEffect(() => {
    if (!src) {
      setCrop(DEFAULT_PHOTO_CROP);
      return;
    }

    loadImage(src).then((img) => {
      setCrop(getSmartDefaultCrop(img.width, img.height));
    });
  }, [src]);

  return { crop, setCrop };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
