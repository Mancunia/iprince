import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "./cron-auth";

const secret = "s".repeat(32);

describe("isAuthorizedCron", () => {
  it("accepts the exact bearer secret", () => {
    expect(isAuthorizedCron(`Bearer ${secret}`, secret)).toBe(true);
  });

  it.each([null, "", secret, `Bearer ${secret}x`, `bearer ${secret}`, "Bearer wrong"])("rejects %s", (header) => {
    expect(isAuthorizedCron(header, secret)).toBe(false);
  });
});
