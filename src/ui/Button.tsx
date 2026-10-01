import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

const VARIANTS = { primary: "btn-primary", secondary: "", ghost: "btn-ghost", danger: "btn-danger" } as const;
const SIZES = { md: "", sm: "btn-sm", lg: "btn-lg" } as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  block?: boolean;
};

export function Button({ variant = "primary", size = "md", block, type = "button", className, ...rest }: Props) {
  return <button type={type} className={cn("btn", VARIANTS[variant], SIZES[size], block ? "btn-block" : "max-w-max", className)} {...rest} />;
}
