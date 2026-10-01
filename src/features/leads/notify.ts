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
