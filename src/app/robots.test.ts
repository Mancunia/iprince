import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "./robots";

afterEach(() => vi.unstubAllEnvs());

describe("robots", () => {
  it("keeps previews and local dev out of search engines", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("indexes production except admin and API routes", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "iprince.de");
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/en/admin", "/de/admin", "/api/"] },
      sitemap: "https://iprince.de/sitemap.xml",
    });
  });
});
