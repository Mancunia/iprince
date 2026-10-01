import type { ElementType, ReactNode } from "react";
import { cn } from "./cn";

/** White rounded surface with a soft shadow. As a link (<a class="card">) it lifts on hover. */
export function Card({ as: Tag = "div", className, children }: { as?: ElementType; className?: string; children: ReactNode }) {
  return <Tag className={cn("card", className)}>{children}</Tag>;
}
