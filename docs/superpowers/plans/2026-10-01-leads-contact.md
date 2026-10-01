# Employer Enquiries and Contact Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public employer enquiry form (`/employers`) and contact form (`/contact`), staff email notification via Resend, admin inbox for both, and automatic deletion after a retention period.

**Architecture:** One domain `src/features/leads/`. Pure, unit-tested logic (`schema.ts`, `guard.ts`, `notify.ts`, `retention.ts`, `inbox.ts`); public server actions use the service role behind zod + honeypot + `hit_rate_limit`; admin reads/writes use the admin session (RLS). The existing cleanup cron route is renamed `/api/cron/cleanup` and gains a retention step. No migration: `employer_leads`, `contact_messages`, their enums and RLS already exist.

**Tech Stack:** Next 16.3 App Router (server actions, `after()`), React 19 `useActionState`, next-intl 4, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), zod 4, Tailwind 4 + design-system classes, Vitest, pgTAP, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-01-leads-contact-design.md` (read it first). Roadmap context: `docs/superpowers/plans/2026-10-01-roadmap.md` §2a.

## Global Constraints

- Work on branch `feat/leads`. Never push, merge to `main` or deploy without the user asking in that moment.
- Every admin server action calls `requireAdmin(locale)` before parsing any other input.
- Admin reads/writes use `createServerSupabase()` (RLS applies). Service role (`createServiceSupabase()`) only for public submissions and the cron job.
- Every user-visible string goes into both `src/i18n/messages/de.json` and `en.json`. German copy uses "Sie".
- Styling: Tailwind utilities for layout, design-system classes from `src/styles/components.css`, semantic tokens (`bg-surface`, `text-fg`, `text-fg-muted`, `border-hairline`), never raw palette ramps.
- Logs never contain personal data (no names, emails, phones, company names, message text). Log ids, kinds, error codes and counts only.
- Notification emails contain no personal data except the company name in an enquiry subject.
- Retention: contact messages 6 months after `updated_at` (any status); enquiries with status `closed`/`archived` 12 months after `updated_at`; open enquiries kept.
- Rate limit: 5 submissions per hour per IP, buckets `lead` and `contact`.
- Next.js is v16: read `node_modules/next/dist/docs/` before using an unfamiliar API (AGENTS.md). `after` is documented in `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`.
- `npm run check` (needs `npx supabase start`) passes before every commit; `npm run test:e2e` passes before merge.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Empty optional fields arrive as `""` from `FormData`** (phone, headcount): they must be stored as `null`, not rejected and not stored as `""`. Pinned in Task 1 (`schema.test.ts`).
2. **Tampered or stale profession ids** (a deactivated profession, a random uuid, duplicates): the enquiry is still accepted and only active, de-duplicated ids are stored. Pinned in Task 1 (`keepKnownIds`) and Task 3 (server-side lookup).
3. **A company name with line breaks or 500 characters** must not break or bloat the email subject: whitespace collapsed, capped at 100 characters. Pinned in Task 2.
4. **A server-action request without an `Origin` header**: the email still goes out, with a relative admin path, and never the text `null`. Pinned in Task 2.
5. **Repeated local e2e runs**: locally every request has IP `unknown`, so the 5/h limit would fail the 6th run within an hour. `e2e/leads.spec.ts` clears the `lead` and `contact` rate-limit buckets before running. Pinned in Task 7.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/features/leads/schema.ts` | zod inputs, status lists, `leadFromForm` / `contactFromForm`, `keepKnownIds` |
| `src/features/leads/guard.ts` | `runSubmission`: validation → honeypot → rate limit → insert, with errors mapped to `ActionResult` |
| `src/features/leads/notify.ts` | `buildStaffEmail`, `notifyStaff` (Resend REST, never throws) |
| `src/features/leads/retention.ts` | `monthsBefore`, `retentionCutoffs`, `deleteExpired` |
| `src/features/leads/inbox.ts` | admin display helpers: status tones, `professionNames`, `messagePreview`, `telHref` |
| `src/features/leads/actions.ts` | `'use server'`: `submitLead`, `submitContact` |
| `src/features/leads/admin-queries.ts` | `server-only`: `listLeads`, `getLead`, `listMessages`, `getMessage`, `countNew` |
| `src/features/leads/admin-actions.ts` | `'use server'`: `updateLead`, `deleteLead`, `updateMessage`, `deleteMessage` |
| `src/features/leads/LeadForm.tsx`, `ContactForm.tsx` | public client forms |
| `src/features/leads/LeadReviewForm.tsx`, `MessageStatusForm.tsx`, `DeleteEntryForm.tsx` | admin client forms |
| `src/app/[locale]/(site)/employers/page.tsx`, `contact/page.tsx` | public pages |
| `src/app/[locale]/admin/(protected)/leads/{page,[id]/page}.tsx`, `messages/{page,[id]/page}.tsx` | admin inbox |
| `src/app/api/cron/cleanup/route.ts` | renamed cron route (applications + retention) |
| `supabase/tests/database/leads.test.sql` | RLS regression test |
| `e2e/leads.spec.ts` | end-to-end flow |

Modified: `src/env.ts`, `src/env.test.ts`, `.env.example`, `vercel.ts`, `README.md`, `docs/superpowers/plans/2026-10-01-roadmap.md`, `e2e/cleanup.spec.ts`, `src/features/professions/queries.ts`, `src/app/[locale]/(site)/page.tsx`, `src/features/site/SiteHeader.tsx`, `src/features/site/SiteFooter.tsx`, `src/features/admin-auth/AdminNav.tsx`, `src/app/[locale]/admin/(protected)/layout.tsx`, `src/i18n/messages/{de,en}.json`.

Deleted: `src/app/api/cron/cleanup-applications/route.ts`.

---

### Task 1: Input schemas and submission pipeline

**Files:**
- Create: `src/features/leads/schema.ts`, `src/features/leads/guard.ts`
- Test: `src/features/leads/schema.test.ts`, `src/features/leads/guard.test.ts`

**Interfaces:**
- Consumes: `fail`, `ok`, `fieldErrorsOf`, `ActionResult` from `src/lib/result.ts`.
- Produces:
  - `LEAD_STATUSES`, `LeadStatus`, `MESSAGE_STATUSES`, `MessageStatus`
  - `leadInput`, `LeadInput` (`{ company: string; contactName: string; email: string; phone: string | null; professionIds: string[]; headcount: number | null; message: string; hp_field: string }`)
  - `contactInput`, `ContactInput` (`{ name: string; email: string; message: string; hp_field: string }`)
  - `leadUpdate` (`{ id, status: LeadStatus, adminNotes }`), `messageUpdate` (`{ id, status: MessageStatus }`)
  - `leadFromForm(formData: FormData): Record<string, unknown>`, `contactFromForm(formData: FormData): Record<string, unknown>`
  - `keepKnownIds(ids: string[], known: string[]): string[]`
  - `runSubmission<T extends { hp_field: string }>(label: string, parsed: Parsed<T>, deps: { hit: () => Promise<boolean>; insert: (input: T) => Promise<string> }): Promise<ActionResult<Submission<T>>>` where `Submission<T> = { id: string; input: T } | null` (`null` = honeypot trap)

- [ ] **Step 1: Write the failing schema test**

Create `src/features/leads/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contactFromForm, contactInput, keepKnownIds, leadFromForm, leadInput } from "./schema";

const P1 = "a0000000-0000-4000-8000-000000000001";
const P2 = "a0000000-0000-4000-8000-000000000002";
const lead = {
  company: " ACME GmbH ",
  contactName: "Erika Muster",
  email: " erika@example.com ",
  phone: "",
  professionIds: [],
  headcount: "",
  message: "",
  hp_field: "",
};
const errorPaths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((i) => String(i.path[0])) ?? [];

describe("leadInput", () => {
  it("trims text and turns blank optional fields into null", () => {
    expect(leadInput.parse(lead)).toEqual({
      company: "ACME GmbH",
      contactName: "Erika Muster",
      email: "erika@example.com",
      phone: null,
      professionIds: [],
      headcount: null,
      message: "",
      hp_field: "",
    });
  });

  it("treats a whitespace-only phone as missing", () => {
    expect(leadInput.parse({ ...lead, phone: "   " }).phone).toBeNull();
  });

  it("requires company, contact name and a valid email", () => {
    const result = leadInput.safeParse({ ...lead, company: "   ", contactName: "", email: "not-an-email" });
    expect(errorPaths(result)).toEqual(expect.arrayContaining(["company", "contactName", "email"]));
  });

  it("accepts headcounts from 1 to 999 only", () => {
    expect(leadInput.parse({ ...lead, headcount: "12" }).headcount).toBe(12);
    for (const headcount of ["0", "1000", "2.5", "abc"]) {
      expect(leadInput.safeParse({ ...lead, headcount }).success).toBe(false);
    }
  });

  it("de-duplicates profession ids and rejects non-uuids", () => {
    expect(leadInput.parse({ ...lead, professionIds: [P1, P1, P2] }).professionIds).toEqual([P1, P2]);
    expect(leadInput.safeParse({ ...lead, professionIds: ["pflege"] }).success).toBe(false);
  });

  it("limits lengths", () => {
    expect(leadInput.safeParse({ ...lead, company: "x".repeat(201) }).success).toBe(false);
    expect(leadInput.safeParse({ ...lead, message: "x".repeat(5001) }).success).toBe(false);
    expect(leadInput.safeParse({ ...lead, phone: "1".repeat(51) }).success).toBe(false);
  });
});

describe("contactInput", () => {
  const contact = { name: "Max", email: "max@example.com", message: "Hallo", hp_field: "" };

  it("accepts a complete message", () => {
    expect(contactInput.parse(contact)).toEqual(contact);
  });

  it("requires a non-blank message of at most 5000 characters", () => {
    expect(contactInput.safeParse({ ...contact, message: "   " }).success).toBe(false);
    expect(contactInput.safeParse({ ...contact, message: "x".repeat(5001) }).success).toBe(false);
  });
});

describe("form readers", () => {
  it("reads every lead field, all checked professions and missing fields as empty strings", () => {
    const data = new FormData();
    data.set("company", "ACME");
    data.append("professionIds", P1);
    data.append("professionIds", P2);
    expect(leadFromForm(data)).toEqual({
      company: "ACME",
      contactName: "",
      email: "",
      phone: "",
      professionIds: [P1, P2],
      headcount: "",
      message: "",
      hp_field: "",
    });
  });

  it("reads contact fields", () => {
    const data = new FormData();
    data.set("name", "Max");
    data.set("hp_field", "bot");
    expect(contactFromForm(data)).toEqual({ name: "Max", email: "", message: "", hp_field: "bot" });
  });
});

describe("keepKnownIds", () => {
  it("keeps only known ids in their submitted order", () => {
    expect(keepKnownIds([P2, "b0000000-0000-4000-8000-000000000009", P1], [P1, P2])).toEqual([P2, P1]);
    expect(keepKnownIds([P1], [])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/leads/schema.test.ts`
Expected: FAIL, cannot resolve `./schema`.

- [ ] **Step 3: Implement `schema.ts`**

Create `src/features/leads/schema.ts`:

```ts
import { z } from "zod";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "closed", "archived"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const MESSAGE_STATUSES = ["new", "read", "archived"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);
const requiredText = (max: number) => z.string().trim().min(1).max(max);
const email = z.string().trim().max(254).pipe(z.email());
const honeypot = z.string().max(1000); // real users never fill it

export const leadInput = z.object({
  company: requiredText(200),
  contactName: requiredText(200),
  email,
  phone: z.preprocess(blankToNull, z.string().trim().max(50).nullable()),
  professionIds: z
    .array(z.guid())
    .max(50)
    .transform((ids) => [...new Set(ids)]),
  headcount: z.preprocess(blankToNull, z.coerce.number().int().min(1).max(999).nullable()),
  message: z.string().trim().max(5000),
  hp_field: honeypot,
});
export type LeadInput = z.output<typeof leadInput>;

export const contactInput = z.object({
  name: requiredText(200),
  email,
  message: requiredText(5000),
  hp_field: honeypot,
});
export type ContactInput = z.output<typeof contactInput>;

export const leadUpdate = z.object({ id: z.guid(), status: z.enum(LEAD_STATUSES), adminNotes: z.string().max(5000) });
export const messageUpdate = z.object({ id: z.guid(), status: z.enum(MESSAGE_STATUSES) });

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export function leadFromForm(formData: FormData): Record<string, unknown> {
  return {
    company: text(formData, "company"),
    contactName: text(formData, "contactName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    professionIds: formData.getAll("professionIds").filter((v): v is string => typeof v === "string"),
    headcount: text(formData, "headcount"),
    message: text(formData, "message"),
    hp_field: text(formData, "hp_field"),
  };
}

export function contactFromForm(formData: FormData): Record<string, unknown> {
  return {
    name: text(formData, "name"),
    email: text(formData, "email"),
    message: text(formData, "message"),
    hp_field: text(formData, "hp_field"),
  };
}

/** Drops ids that are not (or no longer) active professions instead of rejecting the enquiry. */
export function keepKnownIds(ids: string[], known: string[]): string[] {
  const allowed = new Set(known);
  return ids.filter((id) => allowed.has(id));
}
```

- [ ] **Step 4: Run the schema test**

Run: `npx vitest run src/features/leads/schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing guard test**

Create `src/features/leads/guard.test.ts`:

```ts
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
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/features/leads/guard.test.ts`
Expected: FAIL, cannot resolve `./guard`.

- [ ] **Step 7: Implement `guard.ts`**

Create `src/features/leads/guard.ts`:

```ts
import { fail, fieldErrorsOf, ok, type ActionResult } from "@/lib/result";

export type Parsed<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: readonly { path: readonly PropertyKey[] }[] } };

/** The stored row and its input, or null when the honeypot caught a bot. */
export type Submission<T> = { id: string; input: T } | null;

type Deps<T> = { hit: () => Promise<boolean>; insert: (input: T) => Promise<string> };

const codeOf = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";

/**
 * Public submission pipeline: validate, honeypot, rate limit, insert.
 * Validation failures never use rate-limit quota; errors are logged by code only.
 */
export async function runSubmission<T extends { hp_field: string }>(
  label: string,
  parsed: Parsed<T>,
  deps: Deps<T>,
): Promise<ActionResult<Submission<T>>> {
  if (!parsed.success) return fail("invalid", fieldErrorsOf(parsed.error.issues));
  // Bots fill the hidden field. Pretend success so they learn nothing.
  if (parsed.data.hp_field !== "") return ok(null);

  try {
    if (!(await deps.hit())) return fail("rate_limited");
  } catch (error) {
    console.error(`${label} rate limit failed`, codeOf(error));
    return fail("server_error");
  }

  try {
    const id = await deps.insert(parsed.data);
    return ok({ id, input: parsed.data });
  } catch (error) {
    console.error(`${label} insert failed`, codeOf(error));
    return fail("server_error");
  }
}
```

- [ ] **Step 8: Run both tests and typecheck**

Run: `npx vitest run src/features/leads && npm run typecheck`
Expected: PASS, no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/features/leads/schema.ts src/features/leads/schema.test.ts src/features/leads/guard.ts src/features/leads/guard.test.ts
git commit -m "feat(leads): add input schemas and public submission pipeline

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Staff notification email

**Files:**
- Modify: `src/env.ts`, `src/env.test.ts`, `.env.example`
- Create: `src/features/leads/notify.ts`
- Test: `src/features/leads/notify.test.ts`

**Interfaces:**
- Produces:
  - `readNotifyEnv(): NotifyEnv | null` in `src/env.ts`, `NotifyEnv = { RESEND_API_KEY: string; NOTIFY_EMAIL_TO: string; NOTIFY_EMAIL_FROM: string }`
  - `NotifyKind = "lead" | "contact"`, `Notice = { kind: NotifyKind; id: string; origin: string | null; company?: string }`
  - `buildStaffEmail(notice: Notice): { subject: string; text: string }`
  - `notifyStaff(notice: Notice): Promise<void>` (never rejects)

- [ ] **Step 1: Write the failing env test**

Append inside the `describe("env", ...)` block of `src/env.test.ts`, and add `readNotifyEnv` to the import list at the top (`import { readCronEnv, readIntegrationsEnv, readNotifyEnv, readPublicEnv, readServerEnv } from "./env";`):

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/env.test.ts`
Expected: FAIL, `readNotifyEnv` is not exported.

- [ ] **Step 3: Implement `readNotifyEnv`**

Append to `src/env.ts`:

```ts
const notifySchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  NOTIFY_EMAIL_TO: z.email(),
  NOTIFY_EMAIL_FROM: z.string().min(3).max(200),
});

export type NotifyEnv = z.infer<typeof notifySchema>;

/** Staff notification email via Resend. Off (null) unless all three variables are set. */
export function readNotifyEnv(): NotifyEnv | null {
  const raw = {
    RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
    NOTIFY_EMAIL_TO: process.env.NOTIFY_EMAIL_TO || undefined,
    NOTIFY_EMAIL_FROM: process.env.NOTIFY_EMAIL_FROM || undefined,
  };
  if (Object.values(raw).some((value) => value === undefined)) return null;
  return parse(notifySchema, raw);
}
```

Run: `npx vitest run src/env.test.ts`
Expected: PASS.

- [ ] **Step 4: Write the failing notify test**

Create `src/features/leads/notify.test.ts`:

```ts
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
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run src/features/leads/notify.test.ts`
Expected: FAIL, cannot resolve `./notify`.

- [ ] **Step 6: Implement `notify.ts`**

Create `src/features/leads/notify.ts` (no `server-only` import: it would break Vitest, and only server actions import this file):

```ts
import { readNotifyEnv } from "@/env";

export type NotifyKind = "lead" | "contact";
export type Notice = { kind: NotifyKind; id: string; origin: string | null; company?: string };

const ADMIN_PATHS = { lead: "leads", contact: "messages" } as const;
const SUBJECT_COMPANY_MAX = 100;
const TIMEOUT_MS = 5000;

/** German staff email. Carries no personal data apart from the company name of an enquiry. */
export function buildStaffEmail({ kind, id, origin, company }: Notice): { subject: string; text: string } {
  const url = `${origin ?? ""}/de/admin/${ADMIN_PATHS[kind]}/${id}`;
  if (kind === "lead") {
    const name = (company ?? "").replace(/\s+/g, " ").trim().slice(0, SUBJECT_COMPANY_MAX);
    return { subject: `Neue Arbeitgeber-Anfrage: ${name}`, text: `Eine neue Arbeitgeber-Anfrage ist eingegangen:\n${url}\n` };
  }
  return { subject: "Neue Kontaktnachricht", text: `Eine neue Kontaktnachricht ist eingegangen:\n${url}\n` };
}

/** Sends one notification through the Resend REST API. Never throws: a lost email must not fail a submission. */
export async function notifyStaff(notice: Notice): Promise<void> {
  const { kind, id } = notice;
  try {
    const env = readNotifyEnv();
    if (!env) {
      console.info("notify skipped", { kind });
      return;
    }
    const { subject, text } = buildStaffEmail(notice);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.NOTIFY_EMAIL_FROM, to: [env.NOTIFY_EMAIL_TO], subject, text }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) console.error("notify failed", { kind, id, status: response.status });
  } catch (error) {
    console.error("notify failed", { kind, id, error: error instanceof Error ? error.name : "unknown" });
  }
}
```

Note: `DOMException` is an `Error` subclass in Node 22, so `error.name` is `"TimeoutError"`. An invalid env makes `readNotifyEnv` throw an `Error`, logged as `{ error: "Error" }`.

- [ ] **Step 7: Run the tests**

Run: `npx vitest run src/features/leads/notify.test.ts src/env.test.ts`
Expected: PASS.

- [ ] **Step 8: Document the variables**

Append to `.env.example`:

```
# Optional. Staff notification for new employer enquiries and contact messages, sent via Resend (resend.com).
# Leave any of the three empty to turn notifications off (local dev, e2e). FROM must use a domain verified in Resend.
RESEND_API_KEY=
NOTIFY_EMAIL_TO=
NOTIFY_EMAIL_FROM=
```

- [ ] **Step 9: Commit**

```bash
git add src/env.ts src/env.test.ts .env.example src/features/leads/notify.ts src/features/leads/notify.test.ts
git commit -m "feat(leads): notify staff about new entries via Resend

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Retention and the renamed cleanup cron

**Files:**
- Create: `src/features/leads/retention.ts`, `src/app/api/cron/cleanup/route.ts`
- Delete: `src/app/api/cron/cleanup-applications/route.ts`
- Modify: `vercel.ts`, `.env.example`, `README.md`, `docs/superpowers/plans/2026-10-01-roadmap.md`, `e2e/cleanup.spec.ts`
- Test: `src/features/leads/retention.test.ts`, `e2e/cleanup.spec.ts`

**Interfaces:**
- Consumes: `LeadStatus` (Task 1), `cleanupAbandoned` from `src/features/applications/cleanup.ts`, `ServiceClient`.
- Produces: `MESSAGE_RETENTION_MONTHS = 6`, `LEAD_RETENTION_MONTHS = 12`, `LEAD_EXPIRING_STATUSES`, `monthsBefore(now: Date, months: number): Date`, `retentionCutoffs(now: Date): { messages: string; leads: string }`, `deleteExpired(supabase: ServiceClient, now: Date): Promise<{ leadsDeleted: number; messagesDeleted: number }>`. Route `GET /api/cron/cleanup` → `{ applications: CleanupResult | { error: "failed" }, leads: RetentionResult | { error: "failed" } }`.

- [ ] **Step 1: Write the failing retention test**

Create `src/features/leads/retention.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { monthsBefore, retentionCutoffs } from "./retention";

describe("monthsBefore", () => {
  it("goes back whole calendar months in UTC", () => {
    expect(monthsBefore(new Date("2026-03-15T03:00:00Z"), 12).toISOString()).toBe("2025-03-15T03:00:00.000Z");
  });

  it("crosses the year boundary", () => {
    expect(monthsBefore(new Date("2026-01-10T03:00:00Z"), 6).toISOString()).toBe("2025-07-10T03:00:00.000Z");
  });

  it("clamps to the last day of a shorter month", () => {
    expect(monthsBefore(new Date("2026-08-31T03:00:00Z"), 6).toISOString()).toBe("2026-02-28T03:00:00.000Z");
    expect(monthsBefore(new Date("2028-08-31T03:00:00Z"), 6).toISOString()).toBe("2028-02-29T03:00:00.000Z");
  });
});

describe("retentionCutoffs", () => {
  it("keeps messages 6 months and closed enquiries 12 months", () => {
    expect(retentionCutoffs(new Date("2026-10-01T03:00:00Z"))).toEqual({
      messages: "2026-04-01T03:00:00.000Z",
      leads: "2025-10-01T03:00:00.000Z",
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/features/leads/retention.test.ts`
Expected: FAIL, cannot resolve `./retention`.

- [ ] **Step 3: Implement `retention.ts`**

Create `src/features/leads/retention.ts` (type-only imports, so `e2e/cleanup.spec.ts` can import it):

```ts
import type { ServiceClient } from "@/lib/supabase/service";
import type { LeadStatus } from "./schema";

// Quoted in the privacy policy (2d). Any admin edit bumps updated_at and restarts the clock.
export const MESSAGE_RETENTION_MONTHS = 6;
export const LEAD_RETENTION_MONTHS = 12;
export const LEAD_EXPIRING_STATUSES = ["closed", "archived"] as const satisfies readonly LeadStatus[];

export type RetentionResult = { leadsDeleted: number; messagesDeleted: number };

/** Same day and time `months` calendar months earlier (UTC), clamped to the end of shorter months. */
export function monthsBefore(now: Date, months: number): Date {
  const target = new Date(now);
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(now.getUTCDate(), lastDay));
  return target;
}

export function retentionCutoffs(now: Date): { messages: string; leads: string } {
  return {
    messages: monthsBefore(now, MESSAGE_RETENTION_MONTHS).toISOString(),
    leads: monthsBefore(now, LEAD_RETENTION_MONTHS).toISOString(),
  };
}

/** Deletes contact messages and closed/archived enquiries past retention. Idempotent. */
export async function deleteExpired(supabase: ServiceClient, now: Date): Promise<RetentionResult> {
  const cutoffs = retentionCutoffs(now);
  const messages = await supabase.from("contact_messages").delete({ count: "exact" }).lt("updated_at", cutoffs.messages);
  if (messages.error) throw messages.error;
  const leads = await supabase
    .from("employer_leads")
    .delete({ count: "exact" })
    .in("status", [...LEAD_EXPIRING_STATUSES])
    .lt("updated_at", cutoffs.leads);
  if (leads.error) throw leads.error;
  return { leadsDeleted: leads.count ?? 0, messagesDeleted: messages.count ?? 0 };
}
```

Run: `npx vitest run src/features/leads/retention.test.ts`
Expected: PASS.

- [ ] **Step 4: Update the cleanup e2e first (failing)**

In `e2e/cleanup.spec.ts`:

Add the import under the existing `cleanupAbandoned` import:

```ts
import { deleteExpired } from "../src/features/leads/retention";
```

Replace the whole `test("the cleanup cron route requires CRON_SECRET", ...)` block with:

```ts
test("the cleanup cron route requires CRON_SECRET", async ({ request }) => {
  const url = "/api/cron/cleanup";
  expect((await request.get(url)).status()).toBe(401);
  expect((await request.get(url, { headers: { authorization: "Bearer wrong" } })).status()).toBe(401);
  const response = await request.get(url, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    applications: { complete: true },
    leads: { leadsDeleted: expect.any(Number), messagesDeleted: expect.any(Number) },
  });
});

function monthsAgo(months: number) {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.toISOString();
}

test("old contact messages and closed enquiries are deleted; open and recent ones stay", async () => {
  const supabase = service();
  // The set_updated_at trigger only fires on update, so an explicit updated_at on insert sticks.
  const message = async (updatedAt: string) => {
    const { data, error } = await supabase
      .from("contact_messages")
      .insert({ name: "E2E Retention", email: "retention@example.com", message: "old", updated_at: updatedAt })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  };
  const lead = async (status: "new" | "closed" | "archived", updatedAt: string) => {
    const { data, error } = await supabase
      .from("employer_leads")
      .insert({ company: "E2E Retention", contact_name: "E2E", email: "retention@example.com", status, updated_at: updatedAt })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  };
  const oldMessage = await message(monthsAgo(7));
  const recentMessage = await message(monthsAgo(5));
  const oldClosed = await lead("closed", monthsAgo(13));
  const oldOpen = await lead("new", monthsAgo(13));
  const recentArchived = await lead("archived", monthsAgo(11));

  await deleteExpired(supabase, new Date());

  const remaining = async (table: "contact_messages" | "employer_leads", ids: string[]) => {
    const { data, error } = await supabase.from(table).select("id").in("id", ids);
    if (error) throw error;
    return data.map((row) => row.id).sort();
  };
  expect(await remaining("contact_messages", [oldMessage, recentMessage])).toEqual([recentMessage]);
  expect(await remaining("employer_leads", [oldClosed, oldOpen, recentArchived])).toEqual([oldOpen, recentArchived].sort());
});
```

- [ ] **Step 5: Replace the cron route**

Delete `src/app/api/cron/cleanup-applications/route.ts` (`git rm src/app/api/cron/cleanup-applications/route.ts`) and create `src/app/api/cron/cleanup/route.ts`:

```ts
import { NextResponse } from "next/server";
import { readCronEnv } from "@/env";
import { cleanupAbandoned } from "@/features/applications/cleanup";
import { isAuthorizedCron } from "@/features/applications/cron-auth";
import { deleteExpired } from "@/features/leads/retention";
import { createServiceSupabase } from "@/lib/supabase/service";

export const maxDuration = 60;

/** Runs one cleanup step; a failure is logged and reported without skipping the other steps. */
async function step<T>(name: string, run: () => Promise<T>): Promise<T | { error: "failed" }> {
  try {
    const result = await run();
    console.info(name, result);
    return result;
  } catch (error) {
    console.error(`${name} failed`, error);
    return { error: "failed" };
  }
}

export async function GET(request: Request) {
  const { CRON_SECRET } = readCronEnv();
  if (!isAuthorizedCron(request.headers.get("authorization"), CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createServiceSupabase();
  const now = new Date();
  const [applications, leads] = await Promise.all([
    step("cleanup applications", () => cleanupAbandoned(supabase, now)),
    step("cleanup leads", () => deleteExpired(supabase, now)),
  ]);
  const failed = "error" in applications || "error" in leads;
  return NextResponse.json({ applications, leads }, { status: failed ? 500 : 200 });
}
```

(Supabase/Postgrest error objects carry codes and messages, not row data, so logging them matches the existing route.)

- [ ] **Step 6: Point the schedule and docs at the new path**

`vercel.ts`: change the cron entry to `crons: [{ path: "/api/cron/cleanup", schedule: "0 3 * * *" }],` and update the comment above it to:

```ts
// Daily works on every plan: abandoned application data is deleted 24–48 h after it was started;
// contact messages and closed enquiries are deleted after their retention period (src/features/leads/retention.ts).
// On Vercel Pro switch to "0 * * * *" (hourly, ~25 h).
```

`.env.example`: in the `CRON_SECRET` comment replace `/api/cron/cleanup-applications` with `/api/cron/cleanup`.

`README.md`:
- In the commands table replace `localhost:3000/api/cron/cleanup-applications` with `localhost:3000/api/cron/cleanup`.
- Replace the `CRON_SECRET` bullet under "Production Supabase" with:

```markdown
- Set `CRON_SECRET` (`openssl rand -hex 32`) in the Vercel production environment. Vercel Cron calls `/api/cron/cleanup` daily at 03:00 UTC (`vercel.ts`). It deletes unsubmitted applications and unreferenced uploads older than 24 hours (gone within 48 hours), contact messages 6 months after their last change, and closed or archived employer enquiries 12 months after their last change (open enquiries are kept). The privacy policy must state these periods. Check the first run in the Vercel logs.
- Staff notifications for new enquiries and messages: set `RESEND_API_KEY`, `NOTIFY_EMAIL_TO` and `NOTIFY_EMAIL_FROM` (a sender on a domain verified in Resend; the same domain can serve Supabase's custom SMTP). Without them, submissions are still saved and nobody is emailed.
```

`docs/superpowers/plans/2026-10-01-roadmap.md`:
- Phase 3 Step 4: after `optional \`COOKIESCRIPT_ID\`, \`TAWK_*\`` add `, \`RESEND_API_KEY\`, \`NOTIFY_EMAIL_TO\`, \`NOTIFY_EMAIL_FROM\` (Resend account + verified domain)`.
- Phase 3 Step 7: replace `/api/cron/cleanup-applications` with `/api/cron/cleanup`.

- [ ] **Step 7: Verify**

Run: `npm run typecheck && npx vitest run && grep -rn "cleanup-applications" src e2e vercel.ts README.md .env.example`
Expected: typecheck and tests pass; grep prints nothing.

Run (needs `npx supabase start`): `npx playwright test e2e/cleanup.spec.ts`
Expected: 3 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add -A src/app/api/cron src/features/leads/retention.ts src/features/leads/retention.test.ts vercel.ts .env.example README.md docs/superpowers/plans/2026-10-01-roadmap.md e2e/cleanup.spec.ts
git commit -m "feat(leads): delete expired messages and enquiries in the renamed cleanup cron

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: RLS regression test

**Files:**
- Create: `supabase/tests/database/leads.test.sql`

The policies already exist (`20260930000002_rls.sql`), so this test passes on first run. It pins them: the public forms write through the service role, and anon must never read or write either table.

- [ ] **Step 1: Write the test**

Create `supabase/tests/database/leads.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Fixtures (postgres bypasses RLS)
insert into auth.users (id, email) values
  ('13000000-0000-0000-0000-000000000001', 'leads-editor@test.local'),
  ('13000000-0000-0000-0000-000000000002', 'leads-nobody@test.local');
insert into public.admins (user_id, role, display_name) values
  ('13000000-0000-0000-0000-000000000001', 'editor', 'Editor');
insert into public.employer_leads (id, company, contact_name, email) values
  ('13000000-0000-0000-0000-0000000000a1', 'ACME', 'Erika', 'erika@test.local');
insert into public.contact_messages (id, name, email, message) values
  ('13000000-0000-0000-0000-0000000000b1', 'Max', 'max@test.local', 'Hallo');

set local role anon;
select is_empty($$select id from public.employer_leads$$, 'anon cannot read enquiries');
select is_empty($$select id from public.contact_messages$$, 'anon cannot read messages');
select throws_ok($$insert into public.employer_leads (company, contact_name, email) values ('x', 'y', 'z@test.local')$$, '42501', null, 'anon cannot insert enquiries');
select throws_ok($$insert into public.contact_messages (name, email, message) values ('x', 'z@test.local', 'm')$$, '42501', null, 'anon cannot insert messages');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is_empty($$select id from public.employer_leads$$, 'a non-admin cannot read enquiries');
select is_empty($$select id from public.contact_messages$$, 'a non-admin cannot read messages');
select throws_ok($$insert into public.contact_messages (name, email, message) values ('x', 'z@test.local', 'm')$$, '42501', null, 'a non-admin cannot insert messages');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"13000000-0000-0000-0000-000000000001","role":"authenticated"}';
select isnt_empty($$select id from public.employer_leads$$, 'an editor reads enquiries');
select isnt_empty($$select id from public.contact_messages$$, 'an editor reads messages');
update public.employer_leads set status = 'contacted', admin_notes = 'called' where id = '13000000-0000-0000-0000-0000000000a1';
delete from public.contact_messages where id = '13000000-0000-0000-0000-0000000000b1';
reset role;

select is((select status::text from public.employer_leads where id = '13000000-0000-0000-0000-0000000000a1'), 'contacted', 'an editor updates enquiries');
select is_empty($$select id from public.contact_messages where id = '13000000-0000-0000-0000-0000000000b1'$$, 'an editor deletes messages');

select * from finish();
rollback;
```

- [ ] **Step 2: Run it**

Run: `npx supabase test db`
Expected: all files PASS, including `leads.test.sql` with 11 tests. If an anon `throws_ok` reports "no exception" instead, RLS is not enforced on insert: stop and investigate with `superpowers:systematic-debugging` (do not weaken the test).

- [ ] **Step 3: Commit**

```bash
git add supabase/tests/database/leads.test.sql
git commit -m "test(db): pin RLS for employer leads and contact messages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Public forms and pages

**Files:**
- Create: `src/features/leads/actions.ts`, `src/features/leads/LeadForm.tsx`, `src/features/leads/ContactForm.tsx`, `src/app/[locale]/(site)/employers/page.tsx`, `src/app/[locale]/(site)/contact/page.tsx`
- Modify: `src/features/professions/queries.ts`, `src/app/[locale]/(site)/page.tsx`, `src/features/site/SiteHeader.tsx`, `src/features/site/SiteFooter.tsx`, `src/i18n/messages/en.json`, `src/i18n/messages/de.json`

**Interfaces:**
- Consumes: `leadInput`, `contactInput`, `leadFromForm`, `contactFromForm`, `keepKnownIds` (Task 1); `runSubmission` (Task 1); `notifyStaff` (Task 2).
- Produces: `submitLead(prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>>`, `submitContact(...)` with the same signature. `ProfessionCard` gains `id: string`. Form field `name`s: lead `company`, `contactName`, `email`, `phone`, `professionIds` (repeated), `headcount`, `message`, `hp_field`; contact `name`, `email`, `message`, `hp_field`. Visible labels (en) used by Task 7: "Company", "Contact person", "Email", "Phone (optional)", "How many people do you need? (optional)", "Message (optional)", button "Send enquiry"; contact "Name", "Email", "Message", button "Send message".

- [ ] **Step 1: Expose profession ids**

In `src/features/professions/queries.ts`:
- `export type ProfessionCard = { id: string; slug: string; name: LocalizedText; icon: string; openPositions: number };`
- select `"id, slug, name, icon, open_positions"`
- map adds `id: row.id,`

- [ ] **Step 2: Add the server actions**

Create `src/features/leads/actions.ts`:

```ts
"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { ok, type ActionResult } from "@/lib/result";
import { createServiceSupabase, type ServiceClient } from "@/lib/supabase/service";
import { runSubmission } from "./guard";
import { notifyStaff } from "./notify";
import { contactFromForm, contactInput, keepKnownIds, leadFromForm, leadInput } from "./schema";

type Result = ActionResult<null>;
const RATE_LIMIT = { max: 5, windowSeconds: 3600 };

function ipOf(requestHeaders: Headers) {
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function hitRateLimit(supabase: ServiceClient, bucket: "lead" | "contact", ip: string) {
  const { data, error } = await supabase.rpc("hit_rate_limit", {
    p_bucket: bucket, p_key: ip, p_max: RATE_LIMIT.max, p_window_seconds: RATE_LIMIT.windowSeconds,
  });
  if (error) throw error;
  return data;
}

/** Ids of the submitted professions that are currently offered (same filter as the public list). */
async function activeProfessionIds(supabase: ServiceClient, ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("professions")
    .select("id")
    .in("id", ids)
    .eq("is_active", true)
    .not("current_form_id", "is", null);
  if (error) throw error;
  return keepKnownIds(ids, data.map((row) => row.id));
}

export async function submitLead(_prev: Result | null, formData: FormData): Promise<Result> {
  const requestHeaders = await headers();
  const supabase = createServiceSupabase();
  const result = await runSubmission("lead", leadInput.safeParse(leadFromForm(formData)), {
    hit: () => hitRateLimit(supabase, "lead", ipOf(requestHeaders)),
    insert: async (input) => {
      const { data, error } = await supabase
        .from("employer_leads")
        .insert({
          company: input.company,
          contact_name: input.contactName,
          email: input.email,
          phone: input.phone,
          profession_ids: await activeProfessionIds(supabase, input.professionIds),
          headcount: input.headcount,
          message: input.message,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
  });
  if (!result.ok) return result;
  if (result.data) {
    const { id, input } = result.data;
    // Next checks that server-action requests come from this host, so Origin is trustworthy here.
    const origin = requestHeaders.get("origin");
    after(() => notifyStaff({ kind: "lead", id, origin, company: input.company }));
  }
  return ok(null);
}

export async function submitContact(_prev: Result | null, formData: FormData): Promise<Result> {
  const requestHeaders = await headers();
  const supabase = createServiceSupabase();
  const result = await runSubmission("contact", contactInput.safeParse(contactFromForm(formData)), {
    hit: () => hitRateLimit(supabase, "contact", ipOf(requestHeaders)),
    insert: async (input) => {
      const { data, error } = await supabase
        .from("contact_messages")
        .insert({ name: input.name, email: input.email, message: input.message })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
  });
  if (!result.ok) return result;
  if (result.data) {
    const { id } = result.data;
    const origin = requestHeaders.get("origin");
    after(() => notifyStaff({ kind: "contact", id, origin }));
  }
  return ok(null);
}
```

- [ ] **Step 3: Add the messages**

Merge these keys into `src/i18n/messages/en.json` (new top-level objects `publicForms`, `employers`, `contact`; new keys inside the existing `site` and `home` objects):

```json
{
  "site": {
    "navEmployers": "Employers",
    "footerEmployers": "For employers",
    "footerEnquiry": "Request staff",
    "footerContactForm": "Contact form"
  },
  "home": {
    "doors": {
      "candidateKicker": "For candidates",
      "candidateTitle": "Looking for a job in Germany?",
      "candidateText": "Choose your profession and apply in a few minutes. It is free for you.",
      "candidateCta": "View professions",
      "employerKicker": "For employers",
      "employerTitle": "Looking for skilled workers?",
      "employerText": "We find qualified international staff for your company and guide you through the whole process.",
      "employerCta": "Send an enquiry"
    }
  },
  "publicForms": {
    "requiredHint": "Fields marked * are required.",
    "sending": "Sending…",
    "errors": {
      "invalid": "Please check this field.",
      "rate_limited": "Too many attempts. Please try again later.",
      "server_error": "Something went wrong. Please try again."
    }
  },
  "employers": {
    "kicker": "For employers",
    "title": "Skilled workers for your company",
    "lead": "Tell us whom you are looking for. We will get back to you within one working day.",
    "benefits": {
      "selection": "Pre-selected candidates with checked qualifications",
      "process": "Support with recognition, visa and relocation",
      "support": "One contact person from the first call to the first working day"
    },
    "formTitle": "Your enquiry",
    "company": "Company",
    "contactName": "Contact person",
    "email": "Email",
    "phone": "Phone (optional)",
    "professions": "Which professions are you hiring for? (optional)",
    "headcount": "How many people do you need? (optional)",
    "message": "Message (optional)",
    "submit": "Send enquiry",
    "success": "Thank you! We have received your enquiry and will get back to you within one working day.",
    "privacy": "We use your details only to answer your enquiry."
  },
  "contact": {
    "kicker": "Contact",
    "title": "Get in touch",
    "lead": "Questions about applying or working with us? Write to us.",
    "name": "Name",
    "email": "Email",
    "message": "Message",
    "submit": "Send message",
    "success": "Thank you! We have received your message and will get back to you within one working day.",
    "privacy": "We use your details only to answer your message.",
    "whatsappTitle": "Prefer WhatsApp?",
    "whatsappText": "Message us directly. We usually reply the same day."
  }
}
```

And into `src/i18n/messages/de.json`:

```json
{
  "site": {
    "navEmployers": "Arbeitgeber",
    "footerEmployers": "Für Arbeitgeber",
    "footerEnquiry": "Fachkräfte anfragen",
    "footerContactForm": "Kontaktformular"
  },
  "home": {
    "doors": {
      "candidateKicker": "Für Bewerber",
      "candidateTitle": "Sie suchen eine Stelle in Deutschland?",
      "candidateText": "Wählen Sie Ihren Beruf und bewerben Sie sich in wenigen Minuten. Für Sie kostenlos.",
      "candidateCta": "Berufe ansehen",
      "employerKicker": "Für Arbeitgeber",
      "employerTitle": "Sie suchen Fachkräfte?",
      "employerText": "Wir finden qualifizierte internationale Fachkräfte für Ihr Unternehmen und begleiten Sie durch den gesamten Prozess.",
      "employerCta": "Anfrage senden"
    }
  },
  "publicForms": {
    "requiredHint": "Mit * markierte Felder sind Pflichtfelder.",
    "sending": "Wird gesendet…",
    "errors": {
      "invalid": "Bitte prüfen Sie dieses Feld.",
      "rate_limited": "Zu viele Versuche. Bitte später erneut versuchen.",
      "server_error": "Etwas ist schiefgelaufen. Bitte erneut versuchen."
    }
  },
  "employers": {
    "kicker": "Für Arbeitgeber",
    "title": "Fachkräfte für Ihr Unternehmen",
    "lead": "Sagen Sie uns, wen Sie suchen. Wir melden uns innerhalb eines Werktags.",
    "benefits": {
      "selection": "Vorausgewählte Kandidaten mit geprüften Qualifikationen",
      "process": "Unterstützung bei Anerkennung, Visum und Umzug",
      "support": "Eine feste Ansprechperson vom ersten Gespräch bis zum ersten Arbeitstag"
    },
    "formTitle": "Ihre Anfrage",
    "company": "Unternehmen",
    "contactName": "Ansprechperson",
    "email": "E-Mail",
    "phone": "Telefon (optional)",
    "professions": "Für welche Berufe suchen Sie? (optional)",
    "headcount": "Wie viele Personen benötigen Sie? (optional)",
    "message": "Nachricht (optional)",
    "submit": "Anfrage senden",
    "success": "Vielen Dank! Wir haben Ihre Anfrage erhalten und melden uns innerhalb eines Werktags.",
    "privacy": "Wir verwenden Ihre Angaben nur, um Ihre Anfrage zu beantworten."
  },
  "contact": {
    "kicker": "Kontakt",
    "title": "Schreiben Sie uns",
    "lead": "Fragen zur Bewerbung oder zur Zusammenarbeit? Schreiben Sie uns.",
    "name": "Name",
    "email": "E-Mail",
    "message": "Nachricht",
    "submit": "Nachricht senden",
    "success": "Vielen Dank! Wir haben Ihre Nachricht erhalten und melden uns innerhalb eines Werktags.",
    "privacy": "Wir verwenden Ihre Angaben nur, um Ihre Nachricht zu beantworten.",
    "whatsappTitle": "Lieber per WhatsApp?",
    "whatsappText": "Schreiben Sie uns direkt. Wir antworten meist noch am selben Tag."
  }
}
```

Check: `node -e 'for (const l of ["de","en"]) JSON.parse(require("fs").readFileSync("src/i18n/messages/"+l+".json","utf8"))'` exits 0.

- [ ] **Step 4: Build the lead form**

Create `src/features/leads/LeadForm.tsx`. It submits via `onSubmit` + `startTransition` instead of `<form action>`, because React resets a form after an `action` submission and a visitor would lose their input on a validation error.

```tsx
"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, type FormEvent } from "react";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { Input, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { submitLead } from "./actions";

type Option = { id: string; name: string };

export function LeadForm({ professions }: { professions: Option[] }) {
  const t = useTranslations("employers");
  const tf = useTranslations("publicForms");
  const [state, dispatch, pending] = useActionState(submitLead, null);

  if (state?.ok) {
    return (
      <p role="status" className="notice notice-success">
        <Icon name="circle-check" />
        {t("success")}
      </p>
    );
  }

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok && state.formError !== "invalid" ? state.formError : undefined;
  const errorsOf = (key: string) => (fieldErrors[key] ? [tf("errors.invalid")] : undefined);
  const describedBy = (key: string) => (fieldErrors[key] ? `lead-${key}-error` : undefined);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="md">
        <Text tone="muted" size="sm">{tf("requiredHint")}</Text>
        <Field id="lead-company" label={t("company")} required errors={errorsOf("company")}>
          <Input id="lead-company" name="company" autoComplete="organization" required maxLength={200} invalid={Boolean(fieldErrors.company)} aria-describedby={describedBy("company")} />
        </Field>
        <Field id="lead-contactName" label={t("contactName")} required errors={errorsOf("contactName")}>
          <Input id="lead-contactName" name="contactName" autoComplete="name" required maxLength={200} invalid={Boolean(fieldErrors.contactName)} aria-describedby={describedBy("contactName")} />
        </Field>
        <Field id="lead-email" label={t("email")} required errors={errorsOf("email")}>
          <Input id="lead-email" name="email" type="email" autoComplete="email" required maxLength={254} invalid={Boolean(fieldErrors.email)} aria-describedby={describedBy("email")} />
        </Field>
        <Field id="lead-phone" label={t("phone")} errors={errorsOf("phone")}>
          <Input id="lead-phone" name="phone" type="tel" autoComplete="tel" maxLength={50} invalid={Boolean(fieldErrors.phone)} aria-describedby={describedBy("phone")} />
        </Field>
        {professions.length > 0 ? (
          <fieldset className="field" aria-describedby={describedBy("professionIds")}>
            <legend className="label">{t("professions")}</legend>
            {professions.map((p) => (
              <label key={p.id} className="check">
                <Input type="checkbox" name="professionIds" value={p.id} />
                {p.name}
              </label>
            ))}
          </fieldset>
        ) : null}
        <Field id="lead-headcount" label={t("headcount")} errors={errorsOf("headcount")}>
          <Input id="lead-headcount" name="headcount" type="number" inputMode="numeric" min={1} max={999} step={1} className="max-w-32" invalid={Boolean(fieldErrors.headcount)} aria-describedby={describedBy("headcount")} />
        </Field>
        <Field id="lead-message" label={t("message")} errors={errorsOf("message")}>
          <Textarea id="lead-message" name="message" rows={5} maxLength={5000} invalid={Boolean(fieldErrors.message)} aria-describedby={describedBy("message")} />
        </Field>
        <div aria-hidden="true" inert className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <input name="hp_field" tabIndex={-1} autoComplete="off" />
        </div>
        {formError ? (
          <p role="alert" className="notice notice-error">
            <Icon name="circle-alert" />
            {tf(`errors.${formError === "rate_limited" ? "rate_limited" : "server_error"}`)}
          </p>
        ) : null}
        <Text tone="muted" size="sm">{t("privacy")}</Text>
        <Button type="submit" size="lg" disabled={pending}>{pending ? tf("sending") : t("submit")}</Button>
      </Stack>
    </form>
  );
}
```

(`noValidate` lets the server's field errors show in the design-system style; `required`/`maxLength` still drive mobile keyboards and screen-reader hints.)

- [ ] **Step 5: Build the contact form**

Create `src/features/leads/ContactForm.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, type FormEvent } from "react";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { Input, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { submitContact } from "./actions";

export function ContactForm() {
  const t = useTranslations("contact");
  const tf = useTranslations("publicForms");
  const [state, dispatch, pending] = useActionState(submitContact, null);

  if (state?.ok) {
    return (
      <p role="status" className="notice notice-success">
        <Icon name="circle-check" />
        {t("success")}
      </p>
    );
  }

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok && state.formError !== "invalid" ? state.formError : undefined;
  const errorsOf = (key: string) => (fieldErrors[key] ? [tf("errors.invalid")] : undefined);
  const describedBy = (key: string) => (fieldErrors[key] ? `contact-${key}-error` : undefined);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="md">
        <Text tone="muted" size="sm">{tf("requiredHint")}</Text>
        <Field id="contact-name" label={t("name")} required errors={errorsOf("name")}>
          <Input id="contact-name" name="name" autoComplete="name" required maxLength={200} invalid={Boolean(fieldErrors.name)} aria-describedby={describedBy("name")} />
        </Field>
        <Field id="contact-email" label={t("email")} required errors={errorsOf("email")}>
          <Input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} invalid={Boolean(fieldErrors.email)} aria-describedby={describedBy("email")} />
        </Field>
        <Field id="contact-message" label={t("message")} required errors={errorsOf("message")}>
          <Textarea id="contact-message" name="message" rows={6} required maxLength={5000} invalid={Boolean(fieldErrors.message)} aria-describedby={describedBy("message")} />
        </Field>
        <div aria-hidden="true" inert className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <input name="hp_field" tabIndex={-1} autoComplete="off" />
        </div>
        {formError ? (
          <p role="alert" className="notice notice-error">
            <Icon name="circle-alert" />
            {tf(`errors.${formError === "rate_limited" ? "rate_limited" : "server_error"}`)}
          </p>
        ) : null}
        <Text tone="muted" size="sm">{t("privacy")}</Text>
        <Button type="submit" size="lg" disabled={pending}>{pending ? tf("sending") : t("submit")}</Button>
      </Stack>
    </form>
  );
}
```

Note on ids: `Field` renders errors with id `${id}-error`, so `describedBy("company")` must equal `lead-company-error`; the field ids above are `lead-<key>` / `contact-<key>` to match.

- [ ] **Step 6: Add the employers page**

Create `src/app/[locale]/(site)/employers/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { LeadForm } from "@/features/leads/LeadForm";
import { listActiveProfessions } from "@/features/professions/queries";
import { localized } from "@/lib/i18n/localized";
import { Blueprint } from "@/ui/Blueprint";
import { Icon } from "@/ui/Icon";

const BENEFITS = ["selection", "process", "support"] as const;

export default async function EmployersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, professions] = await Promise.all([getTranslations("employers"), listActiveProfessions()]);

  return (
    <div className="door-employer bg-surface text-fg">
      <div className="container-page grid gap-12 py-12 pb-24 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-6">
          <p className="kicker kicker-rule">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
          <ul className="door-list">
            {BENEFITS.map((b) => (
              <li key={b}>
                <Icon name="check" />
                {t(`benefits.${b}`)}
              </li>
            ))}
          </ul>
        </div>
        <Blueprint className="form-section grid gap-6">
          <h2 className="text-xl">{t("formTitle")}</h2>
          <LeadForm professions={professions.map((p) => ({ id: p.id, name: localized(p.name, locale) }))} />
        </Blueprint>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Add the contact page**

Create `src/app/[locale]/(site)/contact/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { ContactForm } from "@/features/leads/ContactForm";
import { WHATSAPP_NUMBER, WHATSAPP_URL } from "@/features/site/contact";
import { Blueprint } from "@/ui/Blueprint";
import { Icon } from "@/ui/Icon";

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tSite] = await Promise.all([getTranslations("contact"), getTranslations("site")]);

  return (
    <div className="container-page grid gap-12 py-12 pb-24 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="grid content-start gap-8">
        <div className="grid gap-4">
          <p className="kicker kicker-rule">{t("kicker")}</p>
          <h1 className="text-3xl">{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
        </div>
        <Blueprint className="form-section">
          <ContactForm />
        </Blueprint>
      </div>
      <aside className="grid content-start gap-4 md:pt-24">
        <h2 className="text-xl">{t("whatsappTitle")}</h2>
        <p className="text-fg-muted">{t("whatsappText")}</p>
        <a href={WHATSAPP_URL} className="btn max-w-max" target="_blank" rel="noopener noreferrer">
          <Icon name="message-circle" />
          {tSite("whatsapp")}: {WHATSAPP_NUMBER}
        </a>
      </aside>
    </div>
  );
}
```

- [ ] **Step 8: Home doors, header and footer**

In `src/app/[locale]/(site)/page.tsx`, insert between the `#berufe` section and the `#ablauf` section:

```tsx
      <section className="border-t border-hairline">
        <div className="door-split">
          <div className="door">
            <p className="kicker kicker-rule">{t("doors.candidateKicker")}</p>
            <h2>{t("doors.candidateTitle")}</h2>
            <p className="text-fg-muted">{t("doors.candidateText")}</p>
            <a href="#berufe" className="btn btn-primary max-w-max">
              {t("doors.candidateCta")}
              <Icon name="arrow-right" />
            </a>
          </div>
          <div className="door door-employer bg-surface text-fg">
            <p className="kicker kicker-rule">{t("doors.employerKicker")}</p>
            <h2>{t("doors.employerTitle")}</h2>
            <p className="text-fg-muted">{t("doors.employerText")}</p>
            <Link href="/employers" className="btn btn-primary max-w-max">
              {t("doors.employerCta")}
              <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>
```

(`.door-employer` remaps the semantic variables on the element itself, and `@theme inline` makes `bg-surface`/`text-fg` resolve per element, so the right door renders dark.)

In `src/features/site/SiteHeader.tsx`, add after the `navSteps` link:

```tsx
          <Link href="/employers">{t("navEmployers")}</Link>
```

In `src/features/site/SiteFooter.tsx`, add a column between the candidates column and the contact column:

```tsx
          <div className="footer-col">
            <h4>{t("footerEmployers")}</h4>
            <Link href="/employers">{t("footerEnquiry")}</Link>
            <Link href="/contact">{t("footerContactForm")}</Link>
          </div>
```

(Footer headings stay `h4` here; 2e changes all of them to `h2` together.)

- [ ] **Step 9: Verify by hand**

Run: `npm run typecheck && npm run lint && npx vitest run`
Expected: PASS.

Run `npm run dev` and check, in both `/de` and `/en`:
- `/en/employers` is dark, lists active professions as checkboxes, and a submit with an empty company shows "Please check this field." under Company while keeping typed values.
- A valid enquiry shows the thank-you notice; the dev server log shows `notify skipped { kind: 'lead' }` and no personal data.
- `/en/contact` works the same way; home shows the two doors; header and footer links resolve.
- In Supabase Studio (http://127.0.0.1:54323 → SQL editor), `select company, profession_ids, headcount, phone from employer_leads order by created_at desc limit 1;` shows `phone` / `headcount` as `null` when left blank.

- [ ] **Step 10: Commit**

```bash
git add src/features/leads/actions.ts src/features/leads/LeadForm.tsx src/features/leads/ContactForm.tsx "src/app/[locale]/(site)" src/features/professions/queries.ts src/features/site/SiteHeader.tsx src/features/site/SiteFooter.tsx src/i18n/messages/en.json src/i18n/messages/de.json
git commit -m "feat(leads): public employer enquiry and contact forms

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Admin inbox

**Files:**
- Create: `src/features/leads/inbox.ts`, `src/features/leads/admin-queries.ts`, `src/features/leads/admin-actions.ts`, `src/features/leads/LeadReviewForm.tsx`, `src/features/leads/MessageStatusForm.tsx`, `src/features/leads/DeleteEntryForm.tsx`, `src/app/[locale]/admin/(protected)/leads/page.tsx`, `src/app/[locale]/admin/(protected)/leads/[id]/page.tsx`, `src/app/[locale]/admin/(protected)/messages/page.tsx`, `src/app/[locale]/admin/(protected)/messages/[id]/page.tsx`
- Modify: `src/features/admin-auth/AdminNav.tsx`, `src/app/[locale]/admin/(protected)/layout.tsx`, `src/i18n/messages/en.json`, `src/i18n/messages/de.json`
- Test: `src/features/leads/inbox.test.ts`

**Interfaces:**
- Consumes: `LEAD_STATUSES`, `LeadStatus`, `MESSAGE_STATUSES`, `MessageStatus`, `leadUpdate`, `messageUpdate` (Task 1); `INBOX_LIMIT` from `src/features/applications/admin-queries.ts`; `StatusTone` from `src/ui/Status.tsx`.
- Produces:
  - `inbox.ts`: `LEAD_STATUS_TONE`, `MESSAGE_STATUS_TONE`, `professionNames<T>(ids: string[], lookup: Map<string, T>): T[]`, `messagePreview(text: string, max?: number): string`, `telHref(phone: string): string`
  - `admin-queries.ts`: `LeadRow`, `LeadDetail`, `MessageRow`, `MessageDetail`, `listLeads(status?)`, `getLead(id)`, `listMessages(status?)`, `getMessage(id)`, `countNew(): Promise<{ leads: number; messages: number }>`
  - `admin-actions.ts`: `updateLead`, `deleteLead`, `updateMessage`, `deleteMessage`, all `(prev: ActionResult<null> | null, formData: FormData) => Promise<ActionResult<null>>`
  - DOM ids used by Task 7: `#lead-status`, `#lead-notes`, `#message-status`; buttons "Save", "Delete"; nav links "Enquiries" / "Messages" (with a count when > 0).

- [ ] **Step 1: Write the failing inbox helper test**

Create `src/features/leads/inbox.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { messagePreview, professionNames, telHref } from "./inbox";

describe("professionNames", () => {
  it("resolves known ids in order and skips unknown ones", () => {
    const lookup = new Map([["a", "Pflege"], ["b", "Elektro"]]);
    expect(professionNames(["b", "x", "a"], lookup)).toEqual(["Elektro", "Pflege"]);
  });
});

describe("messagePreview", () => {
  it("collapses whitespace and keeps short text whole", () => {
    expect(messagePreview("Hallo\n\n  Welt")).toBe("Hallo Welt");
  });

  it("cuts long text at 80 characters with an ellipsis", () => {
    const preview = messagePreview("x".repeat(100));
    expect(preview).toBe(`${"x".repeat(80)}…`);
  });

  it("never splits an emoji", () => {
    const preview = messagePreview(`${"x".repeat(79)}😀😀`);
    expect(preview).toBe(`${"x".repeat(79)}😀…`);
  });
});

describe("telHref", () => {
  it("keeps only digits and a leading plus", () => {
    expect(telHref("+49 (0) 173 / 901-8671")).toBe("tel:+4901739018671");
    expect(telHref("0173 9018671")).toBe("tel:01739018671");
  });
});
```

Run: `npx vitest run src/features/leads/inbox.test.ts`
Expected: FAIL, cannot resolve `./inbox`.

- [ ] **Step 2: Implement `inbox.ts`**

Create `src/features/leads/inbox.ts`:

```ts
import type { StatusTone } from "@/ui/Status";
import type { LeadStatus, MessageStatus } from "./schema";

/** Pill colour for each status in admin lists. */
export const LEAD_STATUS_TONE = {
  new: "new",
  contacted: "review",
  qualified: "review",
  closed: "ok",
  archived: "draft",
} as const satisfies Record<LeadStatus, StatusTone>;

export const MESSAGE_STATUS_TONE = { new: "new", read: "ok", archived: "draft" } as const satisfies Record<MessageStatus, StatusTone>;

/** Names for the stored profession ids; ids of deleted professions are skipped. */
export function professionNames<T>(ids: string[], lookup: Map<string, T>): T[] {
  return ids.flatMap((id) => {
    const name = lookup.get(id);
    return name === undefined ? [] : [name];
  });
}

/** One-line preview for lists, cut by code point so emoji stay intact. */
export function messagePreview(text: string, max = 80): string {
  const chars = Array.from(text.replace(/\s+/g, " ").trim());
  return chars.length <= max ? chars.join("") : `${chars.slice(0, max).join("")}…`;
}

export function telHref(phone: string): string {
  const trimmed = phone.trim();
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${trimmed.replace(/\D/g, "")}`;
}
```

Run: `npx vitest run src/features/leads/inbox.test.ts`
Expected: PASS.

- [ ] **Step 3: Add the admin queries**

Create `src/features/leads/admin-queries.ts`:

```ts
import "server-only";
import { z } from "zod";
import { INBOX_LIMIT } from "@/features/applications/admin-queries";
import { localizedText, type LocalizedText } from "@/lib/i18n/localized";
import { createServerSupabase } from "@/lib/supabase/server";
import { messagePreview, professionNames } from "./inbox";
import type { LeadStatus, MessageStatus } from "./schema";

type Client = Awaited<ReturnType<typeof createServerSupabase>>;

export type LeadRow = {
  id: string;
  company: string;
  contactName: string;
  status: LeadStatus;
  createdAt: string;
  professionNames: LocalizedText[];
};
export type LeadDetail = LeadRow & {
  email: string;
  phone: string | null;
  headcount: number | null;
  message: string;
  adminNotes: string;
};
export type MessageRow = { id: string; name: string; preview: string; status: MessageStatus; createdAt: string };
export type MessageDetail = { id: string; name: string; email: string; message: string; status: MessageStatus; createdAt: string };

/** All professions, inactive ones included, so old enquiries still show their names. */
async function professionLookup(supabase: Client): Promise<Map<string, LocalizedText>> {
  const { data, error } = await supabase.from("professions").select("id, name");
  if (error) throw error;
  const lookup = new Map<string, LocalizedText>();
  for (const row of data) {
    const name = localizedText.safeParse(row.name);
    if (name.success) lookup.set(row.id, name.data);
  }
  return lookup;
}

export async function listLeads(status?: LeadStatus): Promise<LeadRow[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("employer_leads")
    .select("id, company, contact_name, status, created_at, profession_ids")
    .order("created_at", { ascending: false })
    .limit(INBOX_LIMIT);
  if (status) query = query.eq("status", status);
  const [{ data, error }, lookup] = await Promise.all([query, professionLookup(supabase)]);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    company: row.company,
    contactName: row.contact_name,
    status: row.status,
    createdAt: row.created_at,
    professionNames: professionNames(row.profession_ids, lookup),
  }));
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  if (!z.guid().safeParse(id).success) return null;
  const supabase = await createServerSupabase();
  const [{ data: row, error }, lookup] = await Promise.all([
    supabase
      .from("employer_leads")
      .select("id, company, contact_name, email, phone, profession_ids, headcount, message, status, admin_notes, created_at")
      .eq("id", id)
      .maybeSingle(),
    professionLookup(supabase),
  ]);
  if (error) throw error;
  if (!row) return null;
  return {
    id: row.id,
    company: row.company,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    headcount: row.headcount,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    professionNames: professionNames(row.profession_ids, lookup),
  };
}

export async function listMessages(status?: MessageStatus): Promise<MessageRow[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("contact_messages")
    .select("id, name, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(INBOX_LIMIT);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    preview: messagePreview(row.message),
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getMessage(id: string): Promise<MessageDetail | null> {
  if (!z.guid().safeParse(id).success) return null;
  const supabase = await createServerSupabase();
  const { data: row, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, message: row.message, status: row.status, createdAt: row.created_at };
}

/** Counts for the nav badges. */
export async function countNew(): Promise<{ leads: number; messages: number }> {
  const supabase = await createServerSupabase();
  const [leads, messages] = await Promise.all([
    supabase.from("employer_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  if (leads.error) throw leads.error;
  if (messages.error) throw messages.error;
  return { leads: leads.count ?? 0, messages: messages.count ?? 0 };
}
```

- [ ] **Step 4: Add the admin actions**

Create `src/features/leads/admin-actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales, type Locale } from "@/i18n/config";
import { requireAdmin } from "@/features/admin-auth/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { createServerSupabase } from "@/lib/supabase/server";
import { leadUpdate, messageUpdate } from "./schema";

type Result = ActionResult<null>;
const localeOf = (formData: FormData): Locale => z.enum(locales).catch("en").parse(formData.get("locale"));
// The layout holds the nav badges, so every change revalidates the whole admin tree.
const revalidateAdmin = (locale: Locale) => revalidatePath(`/${locale}/admin`, "layout");

export async function updateLead(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const parsed = leadUpdate.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("invalid");
  const { id, status, adminNotes } = parsed.data;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("employer_leads").update({ status, admin_notes: adminNotes }).eq("id", id).select("id");
  if (error) {
    console.error("update lead failed", error.code);
    return fail("server_error");
  }
  if (data.length === 0) return fail("not_found");
  revalidateAdmin(locale);
  return ok(null);
}

export async function updateMessage(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const parsed = messageUpdate.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("invalid");
  const { id, status } = parsed.data;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("contact_messages").update({ status }).eq("id", id).select("id");
  if (error) {
    console.error("update message failed", error.code);
    return fail("server_error");
  }
  if (data.length === 0) return fail("not_found");
  revalidateAdmin(locale);
  return ok(null);
}

export async function deleteLead(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const id = z.guid().safeParse(formData.get("id"));
  if (!id.success) return fail("invalid");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("employer_leads").delete().eq("id", id.data).select("id");
  if (error) {
    console.error("delete lead failed", error.code);
    return fail("server_error");
  }
  if (data.length === 0) return fail("not_found");
  revalidateAdmin(locale);
  redirect(`/${locale}/admin/leads`);
}

export async function deleteMessage(_prev: Result | null, formData: FormData): Promise<Result> {
  const locale = localeOf(formData);
  await requireAdmin(locale);
  const id = z.guid().safeParse(formData.get("id"));
  if (!id.success) return fail("invalid");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("contact_messages").delete().eq("id", id.data).select("id");
  if (error) {
    console.error("delete message failed", error.code);
    return fail("server_error");
  }
  if (data.length === 0) return fail("not_found");
  revalidateAdmin(locale);
  redirect(`/${locale}/admin/messages`);
}
```

- [ ] **Step 5: Add the admin messages**

Merge into the existing `admin` object of `src/i18n/messages/en.json`:

```json
{
  "navLeads": "Enquiries",
  "navMessages": "Messages",
  "inbox": {
    "leadsTitle": "Employer enquiries",
    "messagesTitle": "Contact messages",
    "emptyLeads": "No enquiries yet.",
    "emptyMessages": "No messages yet.",
    "limitNotice": "Showing the latest {count} entries. Use the status filter to narrow the list.",
    "company": "Company",
    "contactName": "Contact person",
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
    "professions": "Professions",
    "headcount": "People needed",
    "message": "Message",
    "received": "Received",
    "backToLeads": "Back to enquiries",
    "backToMessages": "Back to messages",
    "delete": "Delete",
    "confirmDelete": "Delete this entry permanently?",
    "leadStatuses": { "new": "New", "contacted": "Contacted", "qualified": "Qualified", "closed": "Closed", "archived": "Archived" },
    "messageStatuses": { "new": "New", "read": "Read", "archived": "Archived" },
    "errors": {
      "invalid": "Please check your input.",
      "server_error": "Something went wrong.",
      "not_found": "This entry no longer exists."
    }
  }
}
```

And into `admin` of `src/i18n/messages/de.json`:

```json
{
  "navLeads": "Anfragen",
  "navMessages": "Nachrichten",
  "inbox": {
    "leadsTitle": "Arbeitgeber-Anfragen",
    "messagesTitle": "Kontaktnachrichten",
    "emptyLeads": "Noch keine Anfragen.",
    "emptyMessages": "Noch keine Nachrichten.",
    "limitNotice": "Es werden die neuesten {count} Einträge angezeigt. Nutzen Sie den Statusfilter, um die Liste einzugrenzen.",
    "company": "Unternehmen",
    "contactName": "Ansprechperson",
    "name": "Name",
    "email": "E-Mail",
    "phone": "Telefon",
    "professions": "Berufe",
    "headcount": "Benötigte Personen",
    "message": "Nachricht",
    "received": "Eingegangen",
    "backToLeads": "Zurück zu den Anfragen",
    "backToMessages": "Zurück zu den Nachrichten",
    "delete": "Löschen",
    "confirmDelete": "Diesen Eintrag endgültig löschen?",
    "leadStatuses": { "new": "Neu", "contacted": "Kontaktiert", "qualified": "Qualifiziert", "closed": "Abgeschlossen", "archived": "Archiviert" },
    "messageStatuses": { "new": "Neu", "read": "Gelesen", "archived": "Archiviert" },
    "errors": {
      "invalid": "Bitte prüfen Sie Ihre Eingabe.",
      "server_error": "Etwas ist schiefgelaufen.",
      "not_found": "Dieser Eintrag existiert nicht mehr."
    }
  }
}
```

- [ ] **Step 6: Add the admin forms**

Create `src/features/leads/LeadReviewForm.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Select, Textarea } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { updateLead } from "./admin-actions";
import { LEAD_STATUSES, type LeadStatus } from "./schema";

type Props = { id: string; locale: Locale; status: LeadStatus; adminNotes: string };

export function LeadReviewForm({ id, locale, status, adminNotes }: Props) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(updateLead, null);

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="locale" value={locale} />
        <Field id="lead-status" label={t("status")}>
          <Select id="lead-status" name="status" defaultValue={status}>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{t(`inbox.leadStatuses.${s}`)}</option>)}
          </Select>
        </Field>
        <Field id="lead-notes" label={t("notes")}>
          <Textarea id="lead-notes" name="adminNotes" defaultValue={adminNotes} maxLength={5000} />
        </Field>
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`inbox.errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
```

Create `src/features/leads/MessageStatusForm.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { updateMessage } from "./admin-actions";
import { MESSAGE_STATUSES, type MessageStatus } from "./schema";

type Props = { id: string; locale: Locale; status: MessageStatus };

export function MessageStatusForm({ id, locale, status }: Props) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(updateMessage, null);

  return (
    <form action={action}>
      <Stack gap="md">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="locale" value={locale} />
        <Field id="message-status" label={t("status")}>
          <Select id="message-status" name="status" defaultValue={status}>
            {MESSAGE_STATUSES.map((s) => <option key={s} value={s}>{t(`inbox.messageStatuses.${s}`)}</option>)}
          </Select>
        </Field>
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`inbox.errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </Stack>
    </form>
  );
}
```

Create `src/features/leads/DeleteEntryForm.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import { deleteLead, deleteMessage } from "./admin-actions";

export function DeleteEntryForm({ kind, id, locale }: { kind: "lead" | "message"; id: string; locale: Locale }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(kind === "lead" ? deleteLead : deleteMessage, null);

  return (
    <form action={action} className="border-t border-hairline pt-6">
      <Stack gap="sm">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="locale" value={locale} />
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`inbox.errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button
          type="submit"
          variant="danger"
          disabled={pending}
          onClick={(event) => {
            if (!window.confirm(t("inbox.confirmDelete"))) event.preventDefault();
          }}
        >
          {t("inbox.delete")}
        </Button>
      </Stack>
    </form>
  );
}
```

- [ ] **Step 7: Add the enquiry pages**

Create `src/app/[locale]/admin/(protected)/leads/page.tsx`:

```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { INBOX_LIMIT } from "@/features/applications/admin-queries";
import { listLeads } from "@/features/leads/admin-queries";
import { LEAD_STATUS_TONE } from "@/features/leads/inbox";
import { LEAD_STATUSES, type LeadStatus } from "@/features/leads/schema";
import { localized } from "@/lib/i18n/localized";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string }> };

export default async function LeadsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const { status: rawStatus } = await searchParams;
  const status = LEAD_STATUSES.includes(rawStatus as LeadStatus) ? (rawStatus as LeadStatus) : undefined;
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listLeads(status)]);

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("inbox.leadsTitle")}</Text>
      <form className="toolbar">
        <Select name="status" defaultValue={status ?? ""} aria-label={t("status")} dense className="w-auto min-w-48">
          <option value="">{t("allStatuses")}</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{t(`inbox.leadStatuses.${s}`)}</option>)}
        </Select>
        <Button type="submit" variant="secondary" size="sm">{t("filter")}</Button>
      </form>
      {rows.length === 0 ? <Text tone="muted">{t("inbox.emptyLeads")}</Text> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t("inbox.company")}</th>
                <th scope="col">{t("inbox.contactName")}</th>
                <th scope="col">{t("inbox.professions")}</th>
                <th scope="col">{t("status")}</th>
                <th scope="col">{t("inbox.received")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><Link href={`/admin/leads/${row.id}`} className="row-link">{row.company}</Link></td>
                  <td>{row.contactName}</td>
                  <td>{row.professionNames.map((n) => localized(n, locale)).join(", ") || "—"}</td>
                  <td><Status tone={LEAD_STATUS_TONE[row.status]}>{t(`inbox.leadStatuses.${row.status}`)}</Status></td>
                  <td className="nowrap muted">{format.dateTime(new Date(row.createdAt), { dateStyle: "medium", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === INBOX_LIMIT ? <Text tone="muted" size="sm">{t("inbox.limitNotice", { count: INBOX_LIMIT })}</Text> : null}
    </Stack>
  );
}
```

Create `src/app/[locale]/admin/(protected)/leads/[id]/page.tsx`:

```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { getLead } from "@/features/leads/admin-queries";
import { DeleteEntryForm } from "@/features/leads/DeleteEntryForm";
import { telHref } from "@/features/leads/inbox";
import { LeadReviewForm } from "@/features/leads/LeadReviewForm";
import { localized } from "@/lib/i18n/localized";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function LeadDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, format, lead] = await Promise.all([getTranslations("admin"), getFormatter(), getLead(id)]);
  if (!lead) notFound();
  const professions = lead.professionNames.map((n) => localized(n, locale)).join(", ");

  return (
    <Stack gap="lg">
      <Link href="/admin/leads">{t("inbox.backToLeads")}</Link>
      <Text as="h1" size="xl">{lead.company}</Text>
      <Text tone="muted">
        {t("inbox.received")} {format.dateTime(new Date(lead.createdAt), { dateStyle: "medium", timeStyle: "short" })}
      </Text>
      <dl className="spec">
        <div><dt>{t("inbox.contactName")}</dt><dd>{lead.contactName}</dd></div>
        <div><dt>{t("inbox.email")}</dt><dd><a href={`mailto:${lead.email}`}>{lead.email}</a></dd></div>
        <div><dt>{t("inbox.phone")}</dt><dd>{lead.phone ? <a href={telHref(lead.phone)}>{lead.phone}</a> : "—"}</dd></div>
        <div><dt>{t("inbox.headcount")}</dt><dd>{lead.headcount ?? "—"}</dd></div>
        <div><dt>{t("inbox.professions")}</dt><dd>{professions || "—"}</dd></div>
      </dl>
      {lead.message ? (
        <>
          <Text as="h2" size="lg">{t("inbox.message")}</Text>
          <p className="whitespace-pre-wrap">{lead.message}</p>
        </>
      ) : null}
      <LeadReviewForm id={lead.id} locale={locale} status={lead.status} adminNotes={lead.adminNotes} />
      <DeleteEntryForm kind="lead" id={lead.id} locale={locale} />
    </Stack>
  );
}
```

- [ ] **Step 8: Add the message pages**

Create `src/app/[locale]/admin/(protected)/messages/page.tsx`:

```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { INBOX_LIMIT } from "@/features/applications/admin-queries";
import { listMessages } from "@/features/leads/admin-queries";
import { MESSAGE_STATUS_TONE } from "@/features/leads/inbox";
import { MESSAGE_STATUSES, type MessageStatus } from "@/features/leads/schema";
import { Button } from "@/ui/Button";
import { Select } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Status } from "@/ui/Status";
import { Text } from "@/ui/Text";

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string }> };

export default async function MessagesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const { status: rawStatus } = await searchParams;
  const status = MESSAGE_STATUSES.includes(rawStatus as MessageStatus) ? (rawStatus as MessageStatus) : undefined;
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listMessages(status)]);

  return (
    <Stack gap="lg">
      <Text as="h1" size="xl">{t("inbox.messagesTitle")}</Text>
      <form className="toolbar">
        <Select name="status" defaultValue={status ?? ""} aria-label={t("status")} dense className="w-auto min-w-48">
          <option value="">{t("allStatuses")}</option>
          {MESSAGE_STATUSES.map((s) => <option key={s} value={s}>{t(`inbox.messageStatuses.${s}`)}</option>)}
        </Select>
        <Button type="submit" variant="secondary" size="sm">{t("filter")}</Button>
      </form>
      {rows.length === 0 ? <Text tone="muted">{t("inbox.emptyMessages")}</Text> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t("inbox.name")}</th>
                <th scope="col">{t("inbox.message")}</th>
                <th scope="col">{t("status")}</th>
                <th scope="col">{t("inbox.received")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><Link href={`/admin/messages/${row.id}`} className="row-link">{row.name}</Link></td>
                  <td className="muted">{row.preview}</td>
                  <td><Status tone={MESSAGE_STATUS_TONE[row.status]}>{t(`inbox.messageStatuses.${row.status}`)}</Status></td>
                  <td className="nowrap muted">{format.dateTime(new Date(row.createdAt), { dateStyle: "medium", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === INBOX_LIMIT ? <Text tone="muted" size="sm">{t("inbox.limitNotice", { count: INBOX_LIMIT })}</Text> : null}
    </Stack>
  );
}
```

Create `src/app/[locale]/admin/(protected)/messages/[id]/page.tsx`:

```tsx
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { getMessage } from "@/features/leads/admin-queries";
import { DeleteEntryForm } from "@/features/leads/DeleteEntryForm";
import { MessageStatusForm } from "@/features/leads/MessageStatusForm";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function MessageDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, format, message] = await Promise.all([getTranslations("admin"), getFormatter(), getMessage(id)]);
  if (!message) notFound();

  return (
    <Stack gap="lg">
      <Link href="/admin/messages">{t("inbox.backToMessages")}</Link>
      <Text as="h1" size="xl">{message.name}</Text>
      <Text tone="muted">
        <a href={`mailto:${message.email}`}>{message.email}</a> · {t("inbox.received")}{" "}
        {format.dateTime(new Date(message.createdAt), { dateStyle: "medium", timeStyle: "short" })}
      </Text>
      <p className="whitespace-pre-wrap">{message.message}</p>
      <MessageStatusForm id={message.id} locale={locale} status={message.status} />
      <DeleteEntryForm kind="message" id={message.id} locale={locale} />
    </Stack>
  );
}
```

- [ ] **Step 9: Nav entries with badges**

`src/features/admin-auth/AdminNav.tsx`: change `type Item` to `{ href: string; label: string; icon: string; count?: number }` and render the count after the label:

```tsx
          <Icon name={item.icon} size={16} />
          {item.label}
          {item.count ? <span className="badge ml-auto">{item.count}</span> : null}
```

`src/app/[locale]/admin/(protected)/layout.tsx`:
- import `countNew` from `@/features/leads/admin-queries`;
- replace `const t = await getTranslations("admin");` with `const [t, newCounts] = await Promise.all([getTranslations("admin"), countNew()]);`;
- add after the applications item:

```tsx
    { href: "/admin/leads", label: t("navLeads"), icon: "building-2", count: newCounts.leads },
    { href: "/admin/messages", label: t("navMessages"), icon: "mail", count: newCounts.messages },
```

- [ ] **Step 10: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run`
Expected: PASS.

With `npm run dev`, sign in as the local owner and check both locales: badges show the new counts from Task 5's manual entries; list filters work; the enquiry detail shows professions, `mailto:`/`tel:` links and a multi-line message intact; saving status + notes shows "Saved." and the badge drops when the status leaves `new`; delete asks for confirmation, returns to the list and the row is gone; `/en/admin/leads/not-a-uuid` and an unknown uuid both 404.

- [ ] **Step 11: Commit**

```bash
git add src/features/leads "src/app/[locale]/admin/(protected)" src/features/admin-auth/AdminNav.tsx src/i18n/messages/en.json src/i18n/messages/de.json
git commit -m "feat(leads): admin inbox for employer enquiries and contact messages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: End-to-end test and final verification

**Files:**
- Create: `e2e/leads.spec.ts`

**Interfaces:**
- Consumes: labels, buttons and ids from Tasks 5 and 6; `signIn` from `e2e/helpers.ts`; seed profession "Nursing & healthcare" (`pflege`, active with a form).

- [ ] **Step 1: Write the e2e test**

Create `e2e/leads.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { signIn } from "./helpers";

// Locally every request has IP "unknown", so repeated runs would hit the 5/h limit.
test.beforeAll(async () => {
  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from("rate_limits").delete().in("bucket", ["lead", "contact"]);
  if (error) throw error;
});

test("an employer enquiry and a contact message reach the admin inbox", async ({ page }) => {
  const stamp = Date.now();
  const company = `E2E Company ${stamp}`;
  const sender = `E2E Sender ${stamp}`;

  await page.goto("/en/employers");
  await page.getByLabel("Company").fill(company);
  await page.getByLabel("Contact person").fill("Erika Muster");
  await page.getByLabel("Email").fill("employer@example.com");
  await page.getByLabel("Nursing & healthcare").check();
  await page.getByLabel("How many people do you need? (optional)").fill("3");
  await page.getByLabel("Message (optional)").fill("Line one\nLine two");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you");

  await page.goto("/en/contact");
  await page.getByLabel("Name").fill(sender);
  await page.getByLabel("Email").fill("sender@example.com");
  await page.getByLabel("Message").fill("Do you place electricians?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you");

  await signIn(page);
  await expect(page.getByRole("link", { name: /^Enquiries\s*\d+$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Messages\s*\d+$/ })).toBeVisible();

  await page.goto("/en/admin/leads");
  await page.getByRole("link", { name: company }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(company);
  await expect(page.getByText("Nursing & healthcare")).toBeVisible();
  await page.locator("#lead-status").selectOption("contacted");
  await page.locator("#lead-notes").fill("Called back");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");

  await page.goto("/en/admin/messages");
  await page.getByRole("link", { name: sender }).click();
  await expect(page.getByText("Do you place electricians?")).toBeVisible();
  await page.locator("#message-status").selectOption("read");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/messages$/);
  await expect(page.getByRole("link", { name: sender })).toHaveCount(0);
});

test("a contact form with the honeypot filled pretends success and stores nothing", async ({ page }) => {
  const bot = `E2E Bot ${Date.now()}`;
  await page.goto("/en/contact");
  await page.getByLabel("Name").fill(bot);
  await page.getByLabel("Email").fill("bot@example.com");
  await page.getByLabel("Message").fill("spam");
  // The trap is inert and hidden, so set it directly like a bot would.
  await page.locator('input[name="hp_field"]').evaluate((el: HTMLInputElement) => { el.value = "http://spam.test"; });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you");

  await signIn(page);
  await page.goto("/en/admin/messages");
  await expect(page.getByRole("link", { name: bot })).toHaveCount(0);
});

test("admin inbox pages require sign-in", async ({ page }) => {
  await page.goto("/en/admin/leads");
  await expect(page).toHaveURL(/\/en\/admin\/login$/);
});
```

- [ ] **Step 2: Run it**

Run (needs `npx supabase start`): `npx playwright test e2e/leads.spec.ts`
Expected: 3 tests PASS. A failure here is a real bug in Tasks 5–6 (or a label that drifted from the Task 5/6 interfaces): debug with `superpowers:systematic-debugging` rather than loosening the test.

- [ ] **Step 3: Full verification**

Run: `npm run check`
Expected: typecheck, lint, all unit tests, pgTAP (including `leads.test.sql`) and `next build` PASS.

Run: `npm run test:e2e`
Expected: all specs PASS (`apply-and-review`, `cleanup`, `leads`, `profession-builder`, `team`).

Run: `git grep -n "console\.\(error\|info\)" src/features/leads src/app/api/cron`
Expected: every call logs only labels, kinds, ids, codes, statuses or counts.

- [ ] **Step 4: Commit**

```bash
git add e2e/leads.spec.ts
git commit -m "test(e2e): employer enquiry and contact message flow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Review and hand over**

Run `superpowers:requesting-code-review` on `main..feat/leads`. After fixes, ask the user whether to merge. After the merge, update memory `foundation-decisions.md` with: 2a merged, retention periods (6 / 12 months), Resend env vars, cron path `/api/cron/cleanup`.
