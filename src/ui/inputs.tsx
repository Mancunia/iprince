import * as stylex from "@stylexjs/stylex";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { color, font, radius, space } from "./tokens.stylex";

const styles = stylex.create({
  control: {
    fontFamily: font.body,
    fontSize: font.sizeMd,
    paddingBlock: space.sm,
    paddingInline: space.sm,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.sm,
    backgroundColor: color.bg,
    color: color.text,
    maxWidth: "100%",
  },
  invalid: { borderColor: color.danger },
  textarea: { minHeight: "8rem", resize: "vertical" },
});

type Invalid = { invalid?: boolean };

export function Input({ invalid, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "style"> & Invalid) {
  const isBox = rest.type === "checkbox" || rest.type === "radio";
  return <input aria-invalid={invalid || undefined} {...rest} {...(isBox ? {} : stylex.props(styles.control, invalid && styles.invalid))} />;
}

export function Textarea({ invalid, ...rest }: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "style"> & Invalid) {
  return <textarea aria-invalid={invalid || undefined} {...rest} {...stylex.props(styles.control, styles.textarea, invalid && styles.invalid)} />;
}

export function Select({ invalid, ...rest }: Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "style"> & Invalid) {
  return <select aria-invalid={invalid || undefined} {...rest} {...stylex.props(styles.control, invalid && styles.invalid)} />;
}
