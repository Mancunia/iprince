import type { ReactNode } from "react";
import { cn } from "./cn";

const GAPS = { xs: "gap-1", sm: "gap-2", md: "gap-5", lg: "gap-8", xl: "gap-12" } as const;

type Props = {
  children: ReactNode;
  gap?: keyof typeof GAPS;
  direction?: "column" | "row";
  as?: "div" | "section" | "ul" | "form" | "header" | "nav";
  className?: string;
};

export function Stack({ children, gap = "md", direction = "column", as: Tag = "div", className }: Props) {
  return <Tag className={cn("flex", direction === "column" ? "flex-col" : "flex-row flex-wrap items-center", GAPS[gap], className)}>{children}</Tag>;
}
