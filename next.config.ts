import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// A production build without the Supabase URL would silently allow only localhost images.
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.VERCEL_ENV === "production") {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL must be set for production builds (image host allow-list).");
}

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
