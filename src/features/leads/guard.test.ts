import { afterEach, describe, expect, it, vi } from "vitest";
import { runSubmission } from "./guard";

afterEach(() => vi.restoreAllMocks());

const input = { email: "erika@example.com", hp_field: "" };
const valid = { success: true as const, data: input };

describe("runSubmission", () => {
  it("returns field errors and never touches the rate limit for invalid input", async () => {
    const hit = vi.fn();
    const insert = vi.fn();
    const result = await runSubmission("lead", { success: false, error: { issues: [{ path: ["email"] }] } }, { hit, insert });
    expect(result).toEqual({ ok: false, formError: "invalid", fieldErrors: { email: ["invalid"] } });
    expect(hit).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("pretends success for a filled honeypot without rate limiting or inserting", async () => {
    const hit = vi.fn();
    const insert = vi.fn();
    const result = await runSubmission("lead", { success: true, data: { ...input, hp_field: "bot" } }, { hit, insert });
    expect(result).toEqual({ ok: true, data: null });
    expect(hit).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("refuses when the rate limit is exhausted", async () => {
    const insert = vi.fn();
    const result = await runSubmission("lead", valid, { hit: async () => false, insert });
    expect(result).toMatchObject({ ok: false, formError: "rate_limited" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("maps a rate-limit error to server_error and logs only the code", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runSubmission("lead", valid, {
      hit: async () => { throw { code: "PGRST301", message: "erika@example.com" }; },
      insert: vi.fn(),
    });
    expect(result).toMatchObject({ ok: false, formError: "server_error" });
    expect(log).toHaveBeenCalledWith("lead rate limit failed", "PGRST301");
  });

  it("inserts and returns the new id with the parsed input", async () => {
    const insert = vi.fn(async () => "new-id");
    const result = await runSubmission("lead", valid, { hit: async () => true, insert });
    expect(insert).toHaveBeenCalledWith(input);
    expect(result).toEqual({ ok: true, data: { id: "new-id", input } });
  });

  it("maps an insert error to server_error and logs only the code", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runSubmission("contact", valid, {
      hit: async () => true,
      insert: async () => { throw { code: "23514", message: "row contains erika@example.com" }; },
    });
    expect(result).toMatchObject({ ok: false, formError: "server_error" });
    expect(log).toHaveBeenCalledWith("contact insert failed", "23514");
    expect(JSON.stringify(log.mock.calls)).not.toContain("erika");
  });
});
