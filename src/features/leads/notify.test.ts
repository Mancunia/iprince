import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStaffEmail, notifyStaff } from "./notify";

const ID = "c0000000-0000-4000-8000-000000000001";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function configure() {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("NOTIFY_EMAIL_TO", "team@example.com");
  vi.stubEnv("NOTIFY_EMAIL_FROM", "iPrince <noreply@example.com>");
}

describe("buildStaffEmail", () => {
  it("names the company and links to the enquiry", () => {
    const email = buildStaffEmail({ kind: "lead", id: ID, origin: "https://iprince.de", company: "ACME GmbH" });
    expect(email.subject).toBe("Neue Arbeitgeber-Anfrage: ACME GmbH");
    expect(email.text).toContain(`https://iprince.de/de/admin/leads/${ID}`);
  });

  it("collapses line breaks and caps the company at 100 characters", () => {
    const email = buildStaffEmail({ kind: "lead", id: ID, origin: null, company: `ACME\r\nBcc: x@evil.test ${"y".repeat(500)}` });
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.subject.length).toBe("Neue Arbeitgeber-Anfrage: ".length + 100);
  });

  it("links to the message without naming anyone", () => {
    const email = buildStaffEmail({ kind: "contact", id: ID, origin: "https://iprince.de" });
    expect(email.subject).toBe("Neue Kontaktnachricht");
    expect(email.text).toContain(`https://iprince.de/de/admin/messages/${ID}`);
  });

  it("falls back to a relative path without an origin", () => {
    const email = buildStaffEmail({ kind: "contact", id: ID, origin: null });
    expect(email.text).toContain(`/de/admin/messages/${ID}`);
    expect(email.text).not.toContain("null");
  });
});

describe("notifyStaff", () => {
  it("does nothing without configuration", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "info").mockImplementation(() => {});
    await notifyStaff({ kind: "lead", id: ID, origin: null, company: "ACME" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts one email to Resend", async () => {
    configure();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await notifyStaff({ kind: "lead", id: ID, origin: "https://iprince.de", company: "ACME" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer re_test");
    expect(JSON.parse(String(init.body))).toEqual({
      from: "iPrince <noreply@example.com>",
      to: ["team@example.com"],
      subject: "Neue Arbeitgeber-Anfrage: ACME",
      text: expect.stringContaining(`/de/admin/leads/${ID}`),
    });
  });

  it("logs a failed send by status without throwing", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(notifyStaff({ kind: "contact", id: ID, origin: null })).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith("notify failed", { kind: "contact", id: ID, status: 500 });
  });

  it("swallows network errors and timeouts", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("timed out", "TimeoutError"); }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(notifyStaff({ kind: "contact", id: ID, origin: null })).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith("notify failed", { kind: "contact", id: ID, error: "TimeoutError" });
  });

  it("swallows invalid configuration", async () => {
    configure();
    vi.stubEnv("NOTIFY_EMAIL_TO", "not-an-email");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(notifyStaff({ kind: "lead", id: ID, origin: null, company: "ACME" })).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
