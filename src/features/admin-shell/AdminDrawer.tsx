"use client";

import { useRef, type ReactNode } from "react";
import { Icon } from "@/ui/Icon";

type Props = { children: ReactNode; openLabel: string; closeLabel: string };

/** Below 1000px the sidebar opens in a modal drawer. Closes on Escape (native), on the backdrop and on any link. */
export function AdminDrawer({ children, openLabel, closeLabel }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn btn-ghost btn-icon" aria-label={openLabel} onClick={() => dialog.current?.showModal()}>
        <Icon name="menu" />
      </button>
      <dialog
        ref={dialog}
        className="drawer"
        aria-label={openLabel}
        onClick={(event) => {
          const target = event.target as Element;
          if (target === event.currentTarget || target.closest("a")) event.currentTarget.close();
        }}
      >
        <button type="button" className="btn btn-ghost btn-sm btn-icon absolute top-4 right-3" aria-label={closeLabel} onClick={() => dialog.current?.close()}>
          <Icon name="x" size={16} />
        </button>
        {children}
      </dialog>
    </>
  );
}
