/** The ?status= value when it is one allowed status; anything else means "show all". */
export function pickStatus<S extends string>(raw: string | string[] | undefined, allowed: readonly S[]): S | undefined {
  return typeof raw === "string" && (allowed as readonly string[]).includes(raw) ? (raw as S) : undefined;
}
