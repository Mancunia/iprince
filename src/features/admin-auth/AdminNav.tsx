"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { Icon } from "@/ui/Icon";
import { cn } from "@/ui/cn";

type Item = { href: string; label: string; icon: string; count?: number };

/** Admin section links; marks the current section with aria-current. */
export function AdminNav({ items, className, linkClassName }: { items: Item[]; className?: string; linkClassName?: string }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn("side-link", linkClassName)}
          aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
        >
          <Icon name={item.icon} size={16} />
          {item.label}
          {item.count ? <span className="badge ml-auto">{item.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
