import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/features/admin-auth/actions";
import { AdminNav } from "@/features/admin-auth/AdminNav";
import { requireAdmin } from "@/features/admin-auth/session";
import { BrandLogo } from "@/features/site/Brand";
import { Icon } from "@/ui/Icon";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) notFound();
  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin");
  const items = [
    { href: "/admin/applications", label: t("applications"), icon: "inbox" },
    { href: "/admin/professions", label: t("navProfessions"), icon: "briefcase" },
    ...(admin.role === "owner"
      ? [
          { href: "/admin/team", label: t("navTeam"), icon: "users" },
          { href: "/admin/settings", label: t("navSettings"), icon: "settings" },
        ]
      : []),
  ];
  const signOutForm = (
    <form action={signOut}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className="side-link w-full cursor-pointer border-0 bg-transparent text-left">
        <Icon name="log-out" size={16} />
        {t("signOut")}
      </button>
    </form>
  );

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link href="/admin/applications" className="brand mb-6 px-2.5" aria-label="iPrince Admin">
          <BrandLogo />
        </Link>
        <AdminNav items={items} className="grid gap-1" />
        <div className="mt-auto grid gap-1 border-t border-hairline-inverse pt-4">
          <span className="px-2.5 text-xs text-fg-inverse-muted">{admin.displayName}</span>
          {signOutForm}
        </div>
      </aside>

      {/* Below 1000px the side column is hidden; this bar carries the same links. */}
      <div className="admin-side-mobile grid gap-2 bg-surface-inverse px-[var(--gutter)] py-3 text-fg-inverse xl:hidden">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">{admin.displayName}</span>
          {signOutForm}
        </div>
        <AdminNav items={items} className="flex gap-1 overflow-x-auto" linkClassName="whitespace-nowrap" />
      </div>

      <main id="main" className="admin-main">{children}</main>
    </div>
  );
}
