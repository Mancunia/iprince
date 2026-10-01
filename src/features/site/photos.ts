/** Photo slots on the public site. Put the file in public/photos and set its path here; null shows a placeholder. */
export const PHOTO_SLOTS = ["hero", "feature-match", "feature-advisors", "steps", "employer-banner"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

export const PHOTOS: Record<PhotoSlot, string | null> = {
  hero: null,
  "feature-match": null,
  "feature-advisors": null,
  steps: null,
  "employer-banner": null,
};
