import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { countDashboard } from "@/features/admin-dashboard/queries";
import { AdminDrawer } from "@/features/admin-shell/AdminDrawer";
import type { NavGroup } from "@/features/admin-shell/AdminNav";
import { AdminSidebar } from "@/features/admin-shell/AdminSidebar";
import { BrandLogo } from "@/features/site/Brand";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) notFound();
  const admin = await requireAdmin(locale);
  const [t, counts] = await Promise.all([getTranslations("admin"), countDashboard()]);
  const groups: NavGroup[] = [
    {
      label: t("navGroupInbox"),
      items: [
        { href: "/admin", label: t("navDashboard"), icon: "layout-grid", exact: true },
        { href: "/admin/applications", label: t("applications"), icon: "inbox", count: counts.applications },
        { href: "/admin/leads", label: t("navLeads"), icon: "building-2", count: counts.leads },
        { href: "/admin/messages", label: t("navMessages"), icon: "mail", count: counts.messages },
      ],
    },
    {
      label: t("navGroupSetup"),
      items: [
        { href: "/admin/professions", label: t("navProfessions"), icon: "briefcase" },
        { href: "/admin/content", label: t("navContent"), icon: "file-text" },
        { href: "/admin/blog", label: t("navBlog"), icon: "book-open" },
        ...(admin.role === "owner"
          ? [
              { href: "/admin/team", label: t("navTeam"), icon: "users" },
              { href: "/admin/settings", label: t("navSettings"), icon: "settings" },
            ]
          : []),
      ],
    },
  ];
  const sidebar = <AdminSidebar admin={admin} groups={groups} locale={locale} />;

  return (
    <div className="admin">
      <aside className="admin-side">{sidebar}</aside>
      <div className="admin-topbar">
        <AdminDrawer openLabel={t("menuOpen")} closeLabel={t("menuClose")} navLabel={t("navLabel")}>{sidebar}</AdminDrawer>
        <Link href="/admin" className="brand" aria-label="iPrince Admin">
          <BrandLogo />
        </Link>
      </div>
      <main id="main" className="admin-main">{children}</main>
    </div>
  );
}
