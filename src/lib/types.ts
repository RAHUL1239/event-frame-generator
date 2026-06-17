import type { Event, GenderOption } from "@prisma/client";

import type { PhotoCrop } from "./photo-crop";

export type EventWithOptions = Event & { genderOptions: GenderOption[] };

export type MemberDetail = {
  name: string;
  role?: string;
};

export type PersonalFormData = {
  firstName: string;
  lastName: string;
  genderKey: string;
  city: string;
  role: string;
  photo: File;
  photoCrop: PhotoCrop;
  frameThemeKey?: string;
};

export type GroupFormData = {
  groupName: string;
  city: string;
  memberCount: 2 | 3 | 4;
  photos: File[];
  members: MemberDetail[];
  photoCrops: PhotoCrop[];
  frameThemeKey?: string;
};

export type GeneratedAssets = {
  posterDataUrl: string;
  dpDataUrl: string;
};
