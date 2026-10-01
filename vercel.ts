import type { VercelConfig } from "@vercel/config/v1";

// Daily works on every plan: abandoned data is deleted 24–48 h after it was started.
// On Vercel Pro switch to "0 * * * *" (hourly, ~25 h).
export const config: VercelConfig = {
  framework: "nextjs",
  crons: [{ path: "/api/cron/cleanup-applications", schedule: "0 3 * * *" }],
};
