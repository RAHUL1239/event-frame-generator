export type PhotoCrop = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_PHOTO_CROP: PhotoCrop = {
  scale: 0.5,
  offsetX: 0,
  offsetY: 0,
};

export function getSmartDefaultCrop(
  width: number,
  height: number
): PhotoCrop {
  if (height > width * 1.05) {
    return { scale: 0.5, offsetX: 0, offsetY: -0.2 };
  }
  return DEFAULT_PHOTO_CROP;
}
