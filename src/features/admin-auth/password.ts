import type { FieldErrors } from "@/lib/result";

export const MIN_PASSWORD_LENGTH = 12; // keep in sync with supabase/config.toml minimum_password_length

export function checkNewPassword(password: string, confirm: string): FieldErrors | null {
  if (password.length > 200) return { password: ["invalid"] };
  if (password.length < MIN_PASSWORD_LENGTH) return { password: ["too_short"] };
  if (password !== confirm) return { confirm: ["mismatch"] };
  return null;
}
