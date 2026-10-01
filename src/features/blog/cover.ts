export const COVER_EXTENSIONS: Record<string, "jpg" | "png" | "webp"> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const COVER_MAX_BYTES = 5 * 1024 * 1024;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const POST_ID = new RegExp(`^${UUID}$`);

/** Storage folder (bucket `blog`) holding a post's cover files. */
export function coverFolder(postId: string): string {
  return `posts/${postId}`;
}

/** True only for `posts/<postId>/<uuid>.<jpg|png|webp>`, the shape CoverField uploads. */
export function isCoverPathFor(postId: string, path: string): boolean {
  if (!POST_ID.test(postId)) return false;
  return new RegExp(`^posts/${postId}/${UUID}\\.(jpg|png|webp)$`).test(path);
}
