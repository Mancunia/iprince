import { afterEach, describe, expect, it, vi } from "vitest";
import { readPublicEnv, readServerEnv } from "./env";

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
});
