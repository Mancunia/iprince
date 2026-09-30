import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { color, font, space } from "./tokens.stylex";

const styles = stylex.create({
  wrap: { display: "flex", flexDirection: "column", gap: space.xs, borderWidth: 0, margin: 0, padding: 0 },
  label: { fontWeight: 600, fontSize: font.sizeSm, color: color.text },
  help: { fontSize: font.sizeSm, color: color.textMuted, margin: 0 },
  error: { fontSize: font.sizeSm, color: color.danger, margin: 0 },
});

type Props = { id: string; label: string; required?: boolean; help?: string; errors?: string[]; children: ReactNode };

export function Field({ id, label, required, help, errors, children }: Props) {
  return (
    <div {...stylex.props(styles.wrap)}>
      <label htmlFor={id} {...stylex.props(styles.label)}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {help ? <p id={`${id}-help`} {...stylex.props(styles.help)}>{help}</p> : null}
      {children}
      {errors?.map((message) => (
        <p key={message} role="alert" {...stylex.props(styles.error)}>{message}</p>
      ))}
    </div>
  );
}
