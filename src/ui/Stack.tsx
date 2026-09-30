import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { space } from "./tokens.stylex";

const styles = stylex.create({
  base: { display: "flex" },
  column: { flexDirection: "column" },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  xs: { gap: space.xs },
  sm: { gap: space.sm },
  md: { gap: space.md },
  lg: { gap: space.lg },
  xl: { gap: space.xl },
});

type Props = {
  children: ReactNode;
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  direction?: "column" | "row";
  as?: "div" | "section" | "ul" | "form" | "header" | "nav";
  xstyle?: stylex.StyleXStyles;
};

export function Stack({ children, gap = "md", direction = "column", as: Tag = "div", xstyle }: Props) {
  return <Tag {...stylex.props(styles.base, styles[direction], styles[gap], xstyle)}>{children}</Tag>;
}
