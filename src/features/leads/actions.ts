"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { ok, type ActionResult } from "@/lib/result";
import { createServiceSupabase, type ServiceClient } from "@/lib/supabase/service";
import { runSubmission } from "./guard";
import { notifyStaff } from "./notify";
import { contactFromForm, contactInput, keepKnownIds, leadFromForm, leadInput } from "./schema";

type Result = ActionResult<null>;
const RATE_LIMIT = { max: 5, windowSeconds: 3600 };

function ipOf(requestHeaders: Headers) {
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function hitRateLimit(supabase: ServiceClient, bucket: "lead" | "contact", ip: string) {
  const { data, error } = await supabase.rpc("hit_rate_limit", {
    p_bucket: bucket, p_key: ip, p_max: RATE_LIMIT.max, p_window_seconds: RATE_LIMIT.windowSeconds,
  });
  if (error) throw error;
  return data;
}

/** Ids of the submitted professions that are currently offered (same filter as the public list). */
async function activeProfessionIds(supabase: ServiceClient, ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("professions")
    .select("id")
    .in("id", ids)
    .eq("is_active", true)
    .not("current_form_id", "is", null);
  if (error) throw error;
  return keepKnownIds(ids, data.map((row) => row.id));
}

export async function submitLead(_prev: Result | null, formData: FormData): Promise<Result> {
  const requestHeaders = await headers();
  const supabase = createServiceSupabase();
  const result = await runSubmission("lead", leadInput.safeParse(leadFromForm(formData)), {
    hit: () => hitRateLimit(supabase, "lead", ipOf(requestHeaders)),
    insert: async (input) => {
      const { data, error } = await supabase
        .from("employer_leads")
        .insert({
          company: input.company,
          contact_name: input.contactName,
          email: input.email,
          phone: input.phone,
          profession_ids: await activeProfessionIds(supabase, input.professionIds),
          headcount: input.headcount,
          message: input.message,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
  });
  if (!result.ok) return result;
  if (result.data) {
    const { id, input } = result.data;
    // Next checks that server-action requests come from this host, so Origin is trustworthy here.
    const origin = requestHeaders.get("origin");
    after(() => notifyStaff({ kind: "lead", id, origin, company: input.company }));
  }
  return ok(null);
}

export async function submitContact(_prev: Result | null, formData: FormData): Promise<Result> {
  const requestHeaders = await headers();
  const supabase = createServiceSupabase();
  const result = await runSubmission("contact", contactInput.safeParse(contactFromForm(formData)), {
    hit: () => hitRateLimit(supabase, "contact", ipOf(requestHeaders)),
    insert: async (input) => {
      const { data, error } = await supabase
        .from("contact_messages")
        .insert({ name: input.name, email: input.email, message: input.message })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
  });
  if (!result.ok) return result;
  if (result.data) {
    const { id } = result.data;
    const origin = requestHeaders.get("origin");
    after(() => notifyStaff({ kind: "contact", id, origin }));
  }
  return ok(null);
}
