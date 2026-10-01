/** Photo slots on the public site. Admins upload a photo per slot under Admin → Content → Photos. */
export const PHOTO_SLOTS = ["hero", "feature-match", "feature-advisors", "steps", "employer-banner"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];
