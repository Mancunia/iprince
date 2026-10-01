import { describe, expect, it } from "vitest";
import { siteUrl } from "./site-url";

describe("siteUrl", () => {
  it("uses the production domain in production", () => {
    expect(siteUrl({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "iprince.de", VERCEL_URL: "x.vercel.app" }).href).toBe("https://iprince.de/");
  });

  it("uses the deployment URL on previews", () => {
    expect(siteUrl({ VERCEL_ENV: "preview", VERCEL_URL: "x.vercel.app" }).href).toBe("https://x.vercel.app/");
  });

  it("falls back to the local dev server", () => {
    expect(siteUrl({}).href).toBe("http://localhost:3000/");
  });
});
