"use client";

import { useEffect, useRef } from "react";
import { renderFrameThemeThumbnail } from "@/lib/frame-theme-preview";
import type { FrameThemeKey } from "@/lib/frame-themes";

type Props = {
  themeKey: FrameThemeKey;
  size?: number;
  className?: string;
};

export function FrameThemeThumbnail({ themeKey, size, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    void renderFrameThemeThumbnail(canvas, themeKey, size);
  }, [themeKey, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size ?? 96}
      height={size ?? 96}
      className={className ?? "h-16 w-16 shrink-0 rounded-lg border border-gray-200 shadow-sm"}
      aria-hidden
    />
  );
}
