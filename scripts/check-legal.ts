import { createClient } from "@supabase/supabase-js";
import { legalProblems } from "../src/features/site-content/legal-check";

// Launch gate: fails while Impressum or Datenschutzerklärung is missing or still contains [PLATZHALTER markers.
// Uses NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from the environment (falls back to .env.local).
async function checkLegal() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      process.loadEnvFile(".env.local");
    } catch {
      // No .env.local: the check below reports the missing variables.
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("site_content").select("key, value").like("key", "legal.%");
  if (error) {
    console.error("reading site_content failed:", error.code);
    process.exit(1);
  }

  const problems = legalProblems(data);
  if (problems.length > 0) {
    console.error(`Legal pages are not ready (${new URL(url).host}):\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`Legal pages are ready (${new URL(url).host}).`);
}

checkLegal().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
