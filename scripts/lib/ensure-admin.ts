import { createClient } from "@supabase/supabase-js";

type Options = { email: string; password: string; role: "owner" | "editor"; displayName: string };

/** Creates (or reuses) an auth user and upserts its admins row. Returns the user id. */
export async function ensureAdmin({ email, password, role, displayName }: Options): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  let userId = list.users.find((u) => u.email === email)?.id;
  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    userId = data.user.id;
  }

  const { error } = await supabase
    .from("admins")
    .upsert({ user_id: userId, role, display_name: displayName }, { onConflict: "user_id" });
  if (error) throw error;
  return userId;
}
