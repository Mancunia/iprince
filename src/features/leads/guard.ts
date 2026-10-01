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
