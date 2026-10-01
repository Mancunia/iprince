import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { ABANDONED_AFTER_MS, cleanupAbandoned } from "../src/features/applications/cleanup";
import type { Database } from "../src/lib/supabase/database.types";

const PFLEGE = "a0000000-0000-4000-8000-000000000001";
const PFLEGE_FORM = "b0000000-0000-4000-8000-000000000001";
const PDF = Buffer.from("%PDF-1.4\n% e2e\n");

function service() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createApplication(supabase: ReturnType<typeof service>, submitted: boolean) {
  const { data, error } = await supabase
    .from("applications")
    .insert({ profession_id: PFLEGE, form_id: PFLEGE_FORM, full_name: "E2E Cleanup", email: "cleanup@example.com", locale: "en" })
    .select("id")
    .single();
  if (error) throw error;
  const path = `${data.id}/cv/${randomUUID()}-cv.pdf`;
  const { error: uploadError } = await supabase.storage.from("applications").upload(path, PDF, { contentType: "application/pdf" });
  if (uploadError) throw uploadError;
  if (submitted) {
    const { error: finalizeError } = await supabase.rpc("finalize_application", {
      p_application_id: data.id,
      p_files: [{ field_key: "cv", storage_path: path, mime: "application/pdf", size: PDF.length }],
    });
    if (finalizeError) throw finalizeError;
  }
  return { id: data.id, folder: `${data.id}/cv` };
}

async function exists(supabase: ReturnType<typeof service>, id: string) {
  const { data, error } = await supabase.from("applications").select("id").eq("id", id);
  if (error) throw error;
  return data.length === 1;
}

async function fileCount(supabase: ReturnType<typeof service>, folder: string) {
  const { data, error } = await supabase.storage.from("applications").list(folder);
  if (error) throw error;
  return data.length;
}

test("abandoned applications and their uploads are deleted after 24 hours; submitted ones stay", async () => {
  const supabase = service();
  const abandoned = await createApplication(supabase, false);
  const submitted = await createApplication(supabase, true);

  await cleanupAbandoned(supabase, new Date());
  expect(await exists(supabase, abandoned.id)).toBe(true);
  expect(await fileCount(supabase, abandoned.folder)).toBe(1);

  // Pretend a day has passed instead of backdating storage rows.
  const result = await cleanupAbandoned(supabase, new Date(Date.now() + ABANDONED_AFTER_MS + 60_000));
  expect(result.complete).toBe(true);
  expect(await exists(supabase, abandoned.id)).toBe(false);
  expect(await fileCount(supabase, abandoned.folder)).toBe(0);
  expect(await exists(supabase, submitted.id)).toBe(true);
  expect(await fileCount(supabase, submitted.folder)).toBe(1);
});

test("the cleanup cron route requires CRON_SECRET", async ({ request }) => {
  const url = "/api/cron/cleanup-applications";
  expect((await request.get(url)).status()).toBe(401);
  expect((await request.get(url, { headers: { authorization: "Bearer wrong" } })).status()).toBe(401);
  const response = await request.get(url, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ complete: true });
});
