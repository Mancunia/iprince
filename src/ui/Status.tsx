import type { ReactNode } from "react";
import { cn } from "./cn";

const TONES = { neutral: "", new: "status-new", review: "status-review", ok: "status-ok", error: "status-error", draft: "status-draft" } as const;
export type StatusTone = keyof typeof TONES;

/** Square status pill with a leading dot; tone picks the colour. */
export function Status({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={cn("status", TONES[tone])}>{children}</span>;
}
