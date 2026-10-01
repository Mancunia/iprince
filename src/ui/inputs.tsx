import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

type Invalid = { invalid?: boolean; dense?: boolean };

/** Text-like inputs get the .input control style. Checkboxes and radios are styled by their .check / .radio label. */
export function Input({ invalid, dense, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & Invalid) {
  const isBox = rest.type === "checkbox" || rest.type === "radio";
  return <input aria-invalid={invalid || undefined} className={cn(!isBox && "input", dense && "input-dense", className)} {...rest} />;
}

export function Textarea({ invalid, dense, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & Invalid) {
  return <textarea aria-invalid={invalid || undefined} className={cn("textarea", dense && "input-dense", className)} {...rest} />;
}

export function Select({ invalid, dense, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & Invalid) {
  return <select aria-invalid={invalid || undefined} className={cn("select", dense && "input-dense", className)} {...rest} />;
}
