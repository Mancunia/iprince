"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { fail, fieldErrorsOf, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import { readPostForm, toPostRow } from "./schema";

type Result = ActionResult<null>;

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
