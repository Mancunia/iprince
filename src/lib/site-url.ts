type Env = Record<string, string | undefined>;

/** Origin for absolute metadata URLs: the production domain on Vercel production, the deployment URL on previews, else local dev. */
export function siteUrl(env: Env = process.env): URL {
  const host = env.VERCEL_ENV === "production" ? env.VERCEL_PROJECT_PRODUCTION_URL : env.VERCEL_URL;
  return new URL(host ? `https://${host}` : "http://localhost:3000");
}
