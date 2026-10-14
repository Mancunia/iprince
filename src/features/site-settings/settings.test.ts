import { describe, expect, it } from "vitest";
import { chatProviderInput, gaEnabled, resolveChatChannel, tawkMissing } from "./settings";

const full = { cookieScriptId: "cs1", tawk: { propertyId: "p1", widgetId: "w1" } };

describe("resolveChatChannel", () => {
  it("uses tawk.to when it and the consent banner are configured", () => {
    expect(resolveChatChannel("tawk", full)).toEqual({ kind: "tawk", propertyId: "p1", widgetId: "w1" });
  });
  it.each([
    ["no tawk IDs", { cookieScriptId: "cs1", tawk: null }],
    ["no consent banner", { cookieScriptId: null, tawk: full.tawk }],
  ])("falls back to WhatsApp with %s", (_, integrations) => {
    expect(resolveChatChannel("tawk", integrations)).toEqual({ kind: "whatsapp" });
  });
  it("passes WhatsApp and none through", () => {
    expect(resolveChatChannel("whatsapp", full)).toEqual({ kind: "whatsapp" });
    expect(resolveChatChannel("none", full)).toEqual({ kind: "none" });
  });
});

describe("tawkMissing", () => {
  it("lists what is not configured", () => {
    expect(tawkMissing({ cookieScriptId: null, tawk: null })).toEqual(["cookieScript", "tawk"]);
    expect(tawkMissing(full)).toEqual([]);
  });
});

describe("gaEnabled", () => {
  it("needs both the measurement ID and the consent banner", () => {
    expect(gaEnabled({ cookieScriptId: "cs1", gaId: "G-ABCD1234" })).toBe(true);
    expect(gaEnabled({ cookieScriptId: null, gaId: "G-ABCD1234" })).toBe(false);
    expect(gaEnabled({ cookieScriptId: "cs1", gaId: null })).toBe(false);
  });
});

describe("chatProviderInput", () => {
  it("rejects unknown providers", () => {
    expect(chatProviderInput.safeParse("telegram").success).toBe(false);
  });
});
