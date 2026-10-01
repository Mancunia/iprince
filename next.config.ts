import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321");
const isLocalSupabase = supabase.hostname === "127.0.0.1" || supabase.hostname === "localhost";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: supabase.protocol === "http:" ? "http" : "https",
        hostname: supabase.hostname,
        port: supabase.port,
        pathname: "/storage/v1/object/public/site/**",
      },
    ],
    // Only the local Supabase CLI stack lives on a local IP; production Supabase is a public https host.
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
};

export default withNextIntl(nextConfig);
