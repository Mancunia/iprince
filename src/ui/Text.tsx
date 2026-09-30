import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { color, font } from "./tokens.stylex";

const styles = stylex.create({
  base: { margin: 0, fontFamily: font.body },
  sm: { fontSize: font.sizeSm },
  md: { fontSize: font.sizeMd },
  lg: { fontSize: font.sizeLg, fontWeight: 600 },
  xl: { fontSize: font.sizeXl, fontWeight: 700, lineHeight: 1.2 },
  default: { color: color.text },
  muted: { color: color.textMuted },
  danger: { color: color.danger },
  success: { color: color.success },
});

type Props = {
  children: ReactNode;
  as?: "p" | "h1" | "h2" | "h3" | "span";
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "muted" | "danger" | "success";
  role?: "alert" | "status";
};

export function Text({ children, as: Tag = "p", size = "md", tone = "default", role }: Props) {
  return <Tag role={role} {...stylex.props(styles.base, styles[size], styles[tone])}>{children}</Tag>;
}
