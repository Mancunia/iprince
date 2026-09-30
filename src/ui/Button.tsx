import * as stylex from "@stylexjs/stylex";
import type { ButtonHTMLAttributes } from "react";
import { color, font, radius, space } from "./tokens.stylex";

const styles = stylex.create({
  base: {
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: radius.md,
    paddingBlock: space.sm,
    paddingInline: space.md,
    fontFamily: font.body,
    fontSize: font.sizeMd,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    opacity: { default: 1, ":disabled": 0.6 },
  },
  primary: { backgroundColor: color.accent, borderColor: color.accent, color: color.accentText },
  secondary: { backgroundColor: color.surface, borderColor: color.border, color: color.text },
});

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style"> & { variant?: "primary" | "secondary" };

export function Button({ variant = "primary", type = "button", ...rest }: Props) {
  return <button type={type} {...rest} {...stylex.props(styles.base, styles[variant])} />;
}
