import { cn } from "./cn";
import { initials } from "./initials";

/** Initials in a circle. Decorative: the name is always shown as text next to it. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={cn("avatar", className)}>{initials(name)}</span>;
}
