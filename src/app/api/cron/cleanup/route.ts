import { NextResponse } from "next/server";
import { readCronEnv } from "@/env";
import { cleanupAbandoned } from "@/features/applications/cleanup";
import { isAuthorizedCron } from "@/features/applications/cron-auth";
import { deleteExpired } from "@/features/leads/retention";
import { createServiceSupabase } from "@/lib/supabase/service";

export const maxDuration = 60;

/** Runs one cleanup step; a failure is logged and reported without skipping the other steps. */
async function step<T>(name: string, run: () => Promise<T>): Promise<T | { error: "failed" }> {
  try {
    const result = await run();
    console.info(name, result);
    return result;
  } catch (error) {
    console.error(`${name} failed`, error);
    return { error: "failed" };
  }
}

export async function GET(request: Request) {
  const { CRON_SECRET } = readCronEnv();
  if (!isAuthorizedCron(request.headers.get("authorization"), CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createServiceSupabase();
  const now = new Date();
  const [applications, leads] = await Promise.all([
    step("cleanup applications", () => cleanupAbandoned(supabase, now)),
    step("cleanup leads", () => deleteExpired(supabase, now)),
  ]);
  const failed = "error" in applications || "error" in leads;
  return NextResponse.json({ applications, leads }, { status: failed ? 500 : 200 });
}
