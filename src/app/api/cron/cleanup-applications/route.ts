import { NextResponse } from "next/server";
import { readCronEnv } from "@/env";
import { cleanupAbandoned } from "@/features/applications/cleanup";
import { isAuthorizedCron } from "@/features/applications/cron-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export const maxDuration = 60;

export async function GET(request: Request) {
  const { CRON_SECRET } = readCronEnv();
  if (!isAuthorizedCron(request.headers.get("authorization"), CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await cleanupAbandoned(createServiceSupabase(), new Date());
    console.info("cleanup-applications", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("cleanup-applications failed", error);
    return NextResponse.json({ error: "cleanup_failed" }, { status: 500 });
  }
}
