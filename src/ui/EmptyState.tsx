import type { ReactNode } from "react";
import { Icon } from "./Icon";

/** Centred placeholder for an empty list. */
export function EmptyState({ icon, text, children }: { icon: string; text: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="icon-chip icon-chip-navy icon-chip-lg"><Icon name={icon} size={28} /></span>
      <p>{text}</p>
      {children}
    </div>
  );
}
