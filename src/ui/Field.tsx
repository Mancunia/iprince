import type { ReactNode } from "react";
import { ErrorMessages } from "./ErrorMessages";

type Props = { id: string; label: string; required?: boolean; help?: string; errors?: string[]; children: ReactNode };

export function Field({ id, label, required, help, errors, children }: Props) {
  return (
    <div className="field">
      <label htmlFor={id} className="label">
        {label}
        {required ? <span className="req" aria-hidden="true">*</span> : null}
      </label>
      {help ? <p id={`${id}-help`} className="hint">{help}</p> : null}
      {children}
      <ErrorMessages id={id} errors={errors} />
    </div>
  );
}
