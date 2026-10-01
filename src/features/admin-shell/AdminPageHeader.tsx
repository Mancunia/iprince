import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/ui/Icon";

type Props = { title: ReactNode; back?: { href: string; label: string }; actions?: ReactNode };

/** White title bar at the top of every admin page: optional back link, the page's h1, optional actions. */
export function AdminPageHeader({ title, back, actions }: Props) {
  return (
    <header className="admin-page-head">
      <div className="grid min-w-0 gap-1">
        {back ? (
          <Link href={back.href} className="admin-back">
            <Icon name="arrow-left" size={16} />
            {back.label}
          </Link>
        ) : null}
        <h1>{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
