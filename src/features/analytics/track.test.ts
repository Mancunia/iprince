import { afterEach, describe, expect, it, vi } from "vitest";

const vercelTrack = vi.hoisted(() => vi.fn());
vi.mock("@vercel/analytics", () => ({ track: vercelTrack }));

import { track } from "./track";

afterEach(() => {
  vercelTrack.mockReset();
  vi.unstubAllGlobals();
});

describe("track", () => {
  it("always reports to Vercel and skips GA4 until it has loaded", () => {
    vi.stubGlobal("window", {});
    track("contact_message_sent");
    expect(vercelTrack).toHaveBeenCalledWith("contact_message_sent", {});
  });

  it("also reports to GA4 once consent loaded gtag", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    track("application_submitted", { profession: "pflege" });
    expect(vercelTrack).toHaveBeenCalledWith("application_submitted", { profession: "pflege" });
    expect(gtag).toHaveBeenCalledWith("event", "application_submitted", { profession: "pflege" });
  });

  it("drops properties outside the whitelist so no personal data leaves the page", () => {
    vi.stubGlobal("window", {});
    track("chat_opened", { channel: "whatsapp", email: "a@b.de" } as never);
    expect(vercelTrack).toHaveBeenCalledWith("chat_opened", { channel: "whatsapp" });
  });
});
