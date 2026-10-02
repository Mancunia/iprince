import { readPublicEnv } from "@/env";

/** Public URL of a stored cover, or null for the placeholder. */
export function coverSrc(path: string | null): string | null {
  return path ? `${readPublicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog/${path}` : null;
}
