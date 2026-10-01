import type { ElementType, ReactNode } from "react";
import { cn } from "./cn";

type Props = { as?: ElementType; className?: string; children: ReactNode };

/** Hairline frame with "+" registration marks in all four corners. */
export function Blueprint({ as: Tag = "div", className, children }: Props) {
  return (
    <Tag className={cn("blueprint", className)}>
      <span className="corner tl" aria-hidden="true" />
      <span className="corner tr" aria-hidden="true" />
      <span className="corner bl" aria-hidden="true" />
      <span className="corner br" aria-hidden="true" />
      {children}
    </Tag>
  );
}
