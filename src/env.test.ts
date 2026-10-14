import { afterEach, describe, expect, it, vi } from "vitest";
import { readCronEnv, readIntegrationsEnv, readNotifyEnv, readPublicEnv, readServerEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("env", () => {
  it("reads valid public env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    expect(readPublicEnv()).toEqual({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" });
  });

  it("names every missing variable", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not a url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => readServerEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL.*SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("requires a CRON_SECRET of at least 32 characters", () => {
    vi.stubEnv("CRON_SECRET", "short");
    expect(() => readCronEnv()).toThrow(/CRON_SECRET/);
    vi.stubEnv("CRON_SECRET", "x".repeat(32));
    expect(readCronEnv()).toEqual({ CRON_SECRET: "x".repeat(32) });
  });

  it("treats unset or empty integrations as off", () => {
    vi.stubEnv("COOKIESCRIPT_ID", "");
    vi.stubEnv("TAWK_PROPERTY_ID", "abc123");
    expect(readIntegrationsEnv()).toEqual({ cookieScriptId: null, tawk: null, gaId: null, googleVerification: null });
  });

  it("reads complete integrations", () => {
    vi.stubEnv("COOKIESCRIPT_ID", "a1b2c3");
    vi.stubEnv("TAWK_PROPERTY_ID", "64f0aa");
    vi.stubEnv("TAWK_WIDGET_ID", "1h9xyz");
    vi.stubEnv("GA_MEASUREMENT_ID", "G-AB12CD34EF");
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "abc_DEF-123456789");
    expect(readIntegrationsEnv()).toEqual({
      cookieScriptId: "a1b2c3",
      tawk: { propertyId: "64f0aa", widgetId: "1h9xyz" },
      gaId: "G-AB12CD34EF",
      googleVerification: "abc_DEF-123456789",
    });
  });

  it("rejects embed IDs that are not plain alphanumerics", () => {
    vi.stubEnv("TAWK_WIDGET_ID", "../evil");
    expect(() => readIntegrationsEnv()).toThrow(/TAWK_WIDGET_ID/);
  });

  it("accepts only GA4 measurement IDs", () => {
    vi.stubEnv("GA_MEASUREMENT_ID", "UA-1234-1");
    expect(() => readIntegrationsEnv()).toThrow(/GA_MEASUREMENT_ID/);
  });

  it("rejects a verification token with markup", () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", '"><script>');
    expect(() => readIntegrationsEnv()).toThrow(/GOOGLE_SITE_VERIFICATION/);
  });

  it("turns staff notifications off unless all three variables are set", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("NOTIFY_EMAIL_TO", "");
    vi.stubEnv("NOTIFY_EMAIL_FROM", "iPrince <noreply@example.com>");
    expect(readNotifyEnv()).toBeNull();
  });

  it("reads complete notification settings", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("NOTIFY_EMAIL_TO", "team@example.com");
    vi.stubEnv("NOTIFY_EMAIL_FROM", "iPrince <noreply@example.com>");
    expect(readNotifyEnv()).toEqual({
      RESEND_API_KEY: "re_test",
      NOTIFY_EMAIL_TO: "team@example.com",
      NOTIFY_EMAIL_FROM: "iPrince <noreply@example.com>",
    });
  });

  it("rejects an invalid notification address", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("NOTIFY_EMAIL_TO", "not-an-email");
    vi.stubEnv("NOTIFY_EMAIL_FROM", "iPrince <noreply@example.com>");
    expect(() => readNotifyEnv()).toThrow(/NOTIFY_EMAIL_TO/);
  });
});
