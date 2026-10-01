import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/features/admin-auth/actions";
import type { AdminSession } from "@/features/admin-auth/session";
import { BrandLogo } from "@/features/site/Brand";
import { Avatar } from "@/ui/Avatar";
import { Icon } from "@/ui/Icon";
import { AdminNav, type NavGroup } from "./AdminNav";

/** Sidebar content, used in the desktop column and in the mobile drawer. */
export async function AdminSidebar({ admin, groups, locale }: { admin: AdminSession; groups: NavGroup[]; locale: string }) {
  const t = await getTranslations("admin");
  return (
    <div className="side-panel">
      <Link href="/admin" className="brand px-2" aria-label="iPrince Admin">
        <BrandLogo />
      </Link>
      <AdminNav groups={groups} />
      <div className="user-card">
        <Avatar name={admin.displayName} />
        <div className="min-w-0 flex-1">
          <p className="user-card-name truncate">{admin.displayName}</p>
          <p className="user-card-role">{t(`team.roles.${admin.role}`)}</p>
        </div>
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="btn btn-ghost btn-sm btn-icon" aria-label={t("signOut")} title={t("signOut")}>
            <Icon name="log-out" size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
