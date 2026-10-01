"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Icon } from "@/ui/Icon";

type Item = { href: string; label: string; icon: string; count?: number; exact?: boolean };
export type NavGroup = { label: string; items: Item[] };

/** Grouped admin section links; marks the current section with aria-current. */
export function AdminNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const isCurrent = (item: Item) => pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
  return (
    <nav className="grid gap-5">
      {groups.map((group) => (
        <div key={group.label} className="side-group">
          <p className="side-group-label">{group.label}</p>
          {group.items.map((item) => (
            <Link key={item.href} href={item.href} className="side-link" aria-current={isCurrent(item) ? "page" : undefined}>
              <Icon name={item.icon} size={16} />
              {item.label}
              {item.count ? <span className="badge">{item.count}</span> : null}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
