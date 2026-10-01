"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { fail, fieldErrorsOf, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import { coverFolder, isCoverPathFor } from "./cover";
import { readPostForm, toPostRow } from "./schema";

type Result = ActionResult<null>;
type Supabase = Awaited<ReturnType<typeof createServerSupabase>>;

const localeOf = (formData: FormData) => z.enum(locales).catch("en").parse(formData.get("locale"));
const idOf = (formData: FormData) => z.guid().safeParse(formData.get("id"));

function dbFailure(error: PostgrestError, what: string): Result {
  if (error.code === "23505") return fail("invalid", { slug: ["taken"] });
  console.error(`${what} failed`, error.code);
  return fail("server_error");
}

/** Posts show on /blog, post pages and the admin; refresh the whole site like the other admin writes. */
const revalidateBlog = () => revalidatePath("/", "layout");

export async function createPost(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const parsed = readPostForm(formData);
  if (!parsed.success) return fail("invalid", fieldErrorsOf(parsed.error.issues));

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("blog_posts").insert(toPostRow(parsed.data, new Date())).select("id").single();
  if (error) return dbFailure(error, "create post");
  revalidateBlog();
  redirect(`/${locale}/admin/blog/${data.id}`);
}

export async function updatePost(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const id = idOf(formData);
  if (!id.success) return fail("invalid");
  const parsed = readPostForm(formData);
  if (!parsed.success) return fail("invalid", fieldErrorsOf(parsed.error.issues));

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("blog_posts").update(toPostRow(parsed.data, new Date())).eq("id", id.data).select("id");
  if (error) return dbFailure(error, "update post");
  if (data.length === 0) return fail("entry_not_found");
  revalidateBlog();
  return ok(null);
}

/** Deletes every file in the post's cover folder except `keep` (the previous cover and any abandoned upload). */
async function removeCoverFiles(supabase: Supabase, postId: string, keep?: string) {
  const folder = coverFolder(postId);
  const { data, error } = await supabase.storage.from("blog").list(folder);
  if (error) return console.error("list covers failed", error.name);
  const paths = data.map((object) => `${folder}/${object.name}`).filter((path) => path !== keep);
  if (paths.length === 0) return;
  const { error: removeError } = await supabase.storage.from("blog").remove(paths);
  if (removeError) console.error("remove covers failed", removeError.name);
}

export async function deletePost(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const id = idOf(formData);
  if (!id.success) return fail("invalid");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("blog_posts").delete().eq("id", id.data).select("id");
  if (error) return dbFailure(error, "delete post");
  if (data.length === 0) return fail("entry_not_found");
  await removeCoverFiles(supabase, id.data);
  revalidateBlog();
  redirect(`/${locale}/admin/blog`);
}

/** Records a cover the browser already uploaded to posts/<id>/<uuid>.<ext>, then deletes the post's other files. */
export async function setPostCover(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const id = idOf(formData);
  const path = formData.get("path");
  if (!id.success || typeof path !== "string" || !isCoverPathFor(id.data, path)) return fail("invalid");

  const supabase = await createServerSupabase();
  const folder = coverFolder(id.data);
  const fileName = path.slice(folder.length + 1);
  const { data: listed, error: listError } = await supabase.storage.from("blog").list(folder, { search: fileName });
  if (listError || !listed.some((object) => object.name === fileName)) return fail("upload_failed");

  const { data, error } = await supabase.from("blog_posts").update({ cover_path: path }).eq("id", id.data).select("id");
  if (error) return dbFailure(error, "set cover");
  if (data.length === 0) return fail("entry_not_found");
  await removeCoverFiles(supabase, id.data, path);
  revalidateBlog();
  return ok(null);
}

export async function removePostCover(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const id = idOf(formData);
  if (!id.success) return fail("invalid");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("blog_posts").update({ cover_path: null }).eq("id", id.data).select("id");
  if (error) return dbFailure(error, "remove cover");
  if (data.length === 0) return fail("entry_not_found");
  await removeCoverFiles(supabase, id.data);
  revalidateBlog();
  return ok(null);
}
