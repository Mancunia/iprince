import "server-only";
import { createServiceSupabase } from "./service";

/** Supabase Auth admin API (service role). Call only after requireOwner(). */
export function authAdmin() {
  return createServiceSupabase().auth.admin;
}
