"use client";

import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/ui/Icon";

type NavLink = { href: string; label: string };
type Props = { links: NavLink[]; cta: NavLink; openLabel: string; closeLabel: string; navLabel: string };

/** Menu button + top sheet below 960px. Closes on Escape (native), on the backdrop and on any link. */
export function MobileNav({ links, cta, openLabel, closeLabel, navLabel }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn btn-icon menu-btn" aria-label={openLabel} onClick={() => dialog.current?.showModal()}>
        <Icon name="menu" />
      </button>
      <dialog
        ref={dialog}
        className="sheet"
        aria-label={navLabel}
        onClick={(event) => {
          const target = event.target as Element;
          if (target === event.currentTarget || target.closest("a")) event.currentTarget.close();
        }}
      >
        <div className="sheet-head">
          <button type="button" className="btn btn-ghost btn-icon" aria-label={closeLabel} onClick={() => dialog.current?.close()}>
            <Icon name="x" />
          </button>
        </div>
        <nav className="sheet-nav" aria-label={navLabel}>
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <Link href={cta.href} className="btn btn-primary btn-block">{cta.label}</Link>
      </dialog>
    </>
  );
}
