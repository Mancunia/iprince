import { readPublicEnv } from "@/env";

/** Public URL of a stored site photo, or null for the placeholder. */
export function photoSrc(path: string | null): string | null {
  return path ? `${readPublicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site/${path}` : null;
}
