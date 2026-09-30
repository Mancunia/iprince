"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { validateAnswers } from "@/features/forms/answers";
import { buildStoragePath, validateFiles, type FileMeta } from "@/features/forms/files";
import { fail, ok, type ActionResult } from "@/lib/result";
import type { Json } from "@/lib/supabase/database.types";
import { createServiceSupabase, type ServiceClient } from "@/lib/supabase/service";
import { getFormById, getFormForSubmission } from "./queries";
import { fileMetaFromStorage, finalizeInput, isOwnedPath, submissionInput, type FinalizeInput, type SubmissionInput } from "./submission";

const BUCKET = "applications";
const RATE_LIMIT = { max: 20, windowSeconds: 3600 };
const HONEYPOT_ID = "00000000-0000-0000-0000-000000000000";

/** Best-effort cleanup of uploads belonging to a failed finalize. Never throws. */
async function discardUploads(supabase: ServiceClient, paths: string[]) {
  if (paths.length === 0) return;
  try {
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) console.error("discard uploads failed", error);
  } catch (e) {
    console.error("discard uploads failed", e);
  }
}

type Upload = { fieldKey: string; path: string; token: string };

export async function submitApplication(raw: SubmissionInput): Promise<ActionResult<{ applicationId: string; uploads: Upload[] }>> {
  const parsed = submissionInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = ["invalid"];
    return fail("invalid", fieldErrors);
  }
  const input = parsed.data;
  // Bots fill the hidden field. Pretend success so they learn nothing.
  if (input.hp_field) return ok({ applicationId: HONEYPOT_ID, uploads: [] });

  const supabase = createServiceSupabase();
  const form = await getFormForSubmission(supabase, input.professionSlug, input.formId);
  if (!form) return fail("form_unavailable");

  const answers = validateAnswers(form.definition, input.answers);
  const fileErrors = validateFiles(form.definition, input.files);
  if (!answers.ok || Object.keys(fileErrors).length > 0) {
    return fail("invalid", { ...(answers.ok ? {} : answers.fieldErrors), ...fileErrors });
  }

  // Rate-limit only well-formed submissions: validation failures must not consume quota.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { data: allowed, error: rateError } = await supabase.rpc("hit_rate_limit", {
    p_bucket: "apply", p_key: ip, p_max: RATE_LIMIT.max, p_window_seconds: RATE_LIMIT.windowSeconds,
  });
  if (rateError) {
    console.error("hit_rate_limit failed", rateError);
    return fail("server_error");
  }
  if (!allowed) return fail("rate_limited");

  const { data: application, error } = await supabase
    .from("applications")
    .insert({
      profession_id: form.professionId,
      form_id: form.id,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      locale: input.locale,
      answers: answers.data as NonNullable<Json>,
    })
    .select("id")
    .single();
  if (error) {
    console.error("insert application failed", error);
    return fail("server_error");
  }

  const uploads: Upload[] = [];
  for (const file of input.files) {
    const path = buildStoragePath(application.id, file.fieldKey, file.name, randomUUID());
    const { data, error: urlError } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (urlError) {
      console.error("createSignedUploadUrl failed", urlError);
      return fail("server_error");
    }
    uploads.push({ fieldKey: file.fieldKey, path: data.path, token: data.token });
  }
  return ok({ applicationId: application.id, uploads });
}

export async function finalizeApplication(raw: FinalizeInput): Promise<ActionResult<null>> {
  const parsed = finalizeInput.safeParse(raw);
  if (!parsed.success) return fail("invalid");
  const applicationId = parsed.data.applicationId.toLowerCase();
  const { paths } = parsed.data;
  if (applicationId === HONEYPOT_ID) return ok(null);
  if (!paths.every((path) => isOwnedPath(applicationId, path))) return fail("invalid");

  const supabase = createServiceSupabase();
  const { data: application } = await supabase
    .from("applications")
    .select("id, form_id, submitted_at")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application) return fail("invalid");
  if (application.submitted_at) return ok(null); // already finalized (double click / retry)

  const definition = await getFormById(supabase, application.form_id);
  if (!definition) return fail("server_error");

  const files: (FileMeta & { path: string })[] = [];
  for (const path of paths) {
    const { data: meta, error } = await supabase.rpc("storage_object_meta", { p_bucket: BUCKET, p_path: path });
    if (error) {
      console.error("storage_object_meta failed", error);
      return fail("server_error");
    }
    const file = fileMetaFromStorage(path, meta);
    if (!file) {
      await discardUploads(supabase, paths);
      return fail("upload_missing");
    }
    files.push({ ...file, path });
  }

  const fileErrors = validateFiles(definition, files);
  if (Object.keys(fileErrors).length > 0) {
    await discardUploads(supabase, paths);
    return fail("invalid", fileErrors);
  }

  // One atomic statement: only the first finalize wins; a concurrent one gets false.
  const { error } = await supabase.rpc("finalize_application", {
    p_application_id: applicationId,
    p_files: files.map((f) => ({ field_key: f.fieldKey, storage_path: f.path, mime: f.type, size: f.size })),
  });
  if (error) {
    console.error("finalize_application failed", error);
    return fail("server_error");
  }
  return ok(null);
}
