export type FieldErrors = Record<string, string[]>;
export type Failure = { ok: false; formError?: string; fieldErrors?: FieldErrors };
export type ActionResult<T> = { ok: true; data: T } | Failure;

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(formError?: string, fieldErrors?: FieldErrors): Failure {
  return { ok: false, formError, fieldErrors };
}
