export type PreviewAssets = {
  posterDataUrl: string;
};

export function savePreviewAssets(id: string, assets: PreviewAssets) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`preview-${id}`, JSON.stringify(assets));
}

export function loadPreviewAssets(id: string): PreviewAssets | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`preview-${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PreviewAssets;
  } catch {
    return null;
  }
}
