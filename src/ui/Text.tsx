import type { ReactNode } from "react";
import { cn } from "./cn";

const SIZES = { sm: "text-sm", md: "text-base", lg: "text-xl", xl: "text-3xl" } as const;
const TONES = { default: "", muted: "text-fg-muted", danger: "text-error", success: "text-success" } as const;

type Props = {
  children: ReactNode;
  as?: "p" | "h1" | "h2" | "h3" | "span";
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  role?: "alert" | "status";
  className?: string;
};

export function Text({ children, as: Tag = "p", size = "md", tone = "default", role, className }: Props) {
  const heading = Tag !== "p" && Tag !== "span";
  return (
    <Tag role={role} className={cn(SIZES[size], !heading && size === "lg" && "font-semibold", TONES[tone], className)}>
      {children}
    </Tag>
  );
}
