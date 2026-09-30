import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceRoleKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("your-service-role-key")
  );

  const isConfigured = Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("your-project") &&
      !supabaseAnonKey.includes("your-anon-key")
  );

  if (!isConfigured) {
    return NextResponse.json(
      {
        status: "unconfigured",
        message:
          "Supabase environment variables are not yet configured or still using placeholder values.",
        details: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "Present (check if placeholder)" : "Missing",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "Present (check if placeholder)" : "Missing",
          SUPABASE_SERVICE_ROLE_KEY: hasServiceRoleKey ? "Present" : "Optional / Not configured",
        },
        instruction:
          "Update your .env.local file with your Supabase URL and anon key from https://supabase.com/dashboard/project/_/settings/api",
      },
      { status: 200 }
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to connect to Supabase Auth service.",
          error: error.message,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: "connected",
      message: "Successfully connected to Supabase.",
      details: {
        url: supabaseUrl,
        hasAnonKey: true,
        hasServiceRoleKey,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        message: "Unexpected error during Supabase connection attempt.",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
