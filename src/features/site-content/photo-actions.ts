"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { requireAdmin, type AdminSession } from "@/features/admin-auth/session";
import { PHOTO_SLOTS, type PhotoSlot } from "@/features/site/photos";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { contentSchemas, defaults, photoPathFor, type SiteContent } from "./content";
import { fieldErrorsByPath, unflatten } from "./form-data";

type Result = ActionResult<null>;
type Photos = SiteContent["photos"];
type Supabase = Awaited<ReturnType<typeof createServerSupabase>>;

const localeOf = (formData: FormData) => z.enum(locales).catch("en").parse(formData.get("locale"));
const slotOf = (formData: FormData) => z.enum(PHOTO_SLOTS).safeParse(formData.get("slot"));

/** The stored photos row, read fresh (not the cached page read) so concurrent edits of other slots survive. */
async function readPhotos(supabase: Supabase): Promise<Photos | null> {
  const { data, error } = await supabase.from("site_content").select("value").eq("key", "photos").maybeSingle();
  if (error) {
    console.error("read photos failed", error.code);
    return null;
  }
  if (!data) return defaults.photos;
  const parsed = contentSchemas.photos.safeParse(data.value);
  if (parsed.success) return parsed.data;
  console.error("invalid photos value");
  return defaults.photos;
}

async function writePhotos(supabase: Supabase, session: AdminSession, photos: Photos): Promise<boolean> {
  const { data, error } = await supabase
    .from("site_content")
    .upsert({ key: "photos", value: photos as unknown as NonNullable<Json>, updated_by: session.userId }, { onConflict: "key" })
    .select("key");
  if (error || data.length === 0) {
    console.error("write photos failed", error?.code ?? "no row written");
    return false;
  }
  return true;
}

async function removeObject(supabase: Supabase, path: string | null) {
  if (!path) return;
  const { error } = await supabase.storage.from("site").remove([path]);
  if (error) console.error("remove site photo failed", error.name);
}

/** Records a photo the browser already uploaded to `site/<slot>/<uuid>.<ext>`, then deletes the previous file. */
export async function setSitePhoto(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const session = await requireAdmin(locale);
  const slot = slotOf(formData);
  const path = formData.get("path");
  if (!slot.success || typeof path !== "string" || !photoPathFor(slot.data).test(path)) return fail("invalid");

  const supabase = await createServerSupabase();
  const fileName = path.slice(slot.data.length + 1);
  const { data: listed, error: listError } = await supabase.storage.from("site").list(slot.data, { search: fileName });
  if (listError || !listed.some((object) => object.name === fileName)) return fail("upload_failed");

  const photos = await readPhotos(supabase);
  if (!photos) return fail("server_error");
  const previous = photos[slot.data].path;
  if (!(await writePhotos(supabase, session, { ...photos, [slot.data]: { ...photos[slot.data], path } }))) return fail("server_error");
  if (previous !== path) await removeObject(supabase, previous);
  revalidatePath("/", "layout");
  return ok(null);
}

export async function removeSitePhoto(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const session = await requireAdmin(locale);
  const slot = slotOf(formData);
  if (!slot.success) return fail("invalid");

  const supabase = await createServerSupabase();
  const photos = await readPhotos(supabase);
  if (!photos) return fail("server_error");
  const previous = photos[slot.data].path;
  if (!(await writePhotos(supabase, session, { ...photos, [slot.data]: { ...photos[slot.data], path: null } }))) return fail("server_error");
  await removeObject(supabase, previous);
  revalidatePath("/", "layout");
  return ok(null);
}

/** Saves the alt texts of all slots; paths are kept from the stored row. */
export async function savePhotoAlts(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  const session = await requireAdmin(locale);
  const supabase = await createServerSupabase();
  const photos = await readPhotos(supabase);
  if (!photos) return fail("server_error");

  const input = unflatten(formData) as Record<string, { alt?: unknown } | undefined>;
  const merged = Object.fromEntries(PHOTO_SLOTS.map((slot: PhotoSlot) => [slot, { path: photos[slot].path, alt: input[slot]?.alt }]));
  const parsed = contentSchemas.photos.safeParse(merged);
  if (!parsed.success) return fail("invalid", fieldErrorsByPath(parsed.error.issues));
  if (!(await writePhotos(supabase, session, parsed.data))) return fail("server_error");
  revalidatePath("/", "layout");
  return ok(null);
}
