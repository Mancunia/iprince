import type { VercelConfig } from "@vercel/config/v1";

// Daily works on every plan: abandoned application data is deleted 24–48 h after it was started;
// contact messages and closed enquiries are deleted after their retention period (src/features/leads/retention.ts).
// On Vercel Pro switch to "0 * * * *" (hourly, ~25 h).
export const config: VercelConfig = {
  framework: "nextjs",
  crons: [{ path: "/api/cron/cleanup", schedule: "0 3 * * *" }],
};
