import "server-only";
import { authAdmin } from "@/lib/supabase/auth-admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { memberStatus } from "./team";

export type TeamMember = {
  userId: string;
  displayName: string;
  role: "owner" | "editor";
  email: string;
  status: "active" | "pending";
};

export async function listTeam(): Promise<TeamMember[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("admins").select("user_id, display_name, role").order("created_at");
  if (error) throw error;
  const admin = authAdmin();
  return Promise.all(
    data.map(async (row) => {
      const { data: auth, error: authError } = await admin.getUserById(row.user_id);
      if (authError) throw authError;
      return {
        userId: row.user_id,
        displayName: row.display_name,
        role: row.role,
        email: auth.user.email ?? "",
        status: memberStatus(auth.user.last_sign_in_at),
      };
    }),
  );
}
