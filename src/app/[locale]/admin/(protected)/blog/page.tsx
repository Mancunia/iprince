import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { AdminPageHeader } from "@/features/admin-shell/AdminPageHeader";
import { StatusTabs } from "@/features/admin-shell/StatusTabs";
import { listPostsForAdmin } from "@/features/blog/admin-queries";
import { POST_STATES, type PostState } from "@/features/blog/publish";
import { localized } from "@/lib/i18n/localized";
import { pickStatus } from "@/lib/status-param";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Icon } from "@/ui/Icon";
import { Status, type StatusTone } from "@/ui/Status";

const STATE_TONE: Record<PostState, StatusTone> = { draft: "draft", scheduled: "review", live: "ok" };

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ status?: string | string[] }> };

export default async function BlogAdminPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const state = pickStatus((await searchParams).status, POST_STATES);
  const [t, format, rows] = await Promise.all([getTranslations("admin"), getFormatter(), listPostsForAdmin(state)]);
  const actions = (
    <>
      <Link href="/admin/blog/categories" className="btn btn-sm">
        <Icon name="list" size={16} />
        {t("blog.categories")}
      </Link>
      <Link href="/admin/blog/new" className="btn btn-primary btn-sm">
        <Icon name="plus" size={16} />
        {t("blog.newPost")}
      </Link>
    </>
  );

  return (
    <>
      <AdminPageHeader title={t("blog.title")} actions={actions} />
      <Card className="card-flush">
        <StatusTabs
          href="/admin/blog"
          current={state}
          statuses={POST_STATES}
          label={(s) => t(`blog.states.${s}`)}
          allLabel={t("allStatuses")}
          ariaLabel={t("statusFilter")}
        />
        {rows.length === 0 ? <EmptyState icon="book-open" text={t("blog.empty")} /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t("blog.postTitle")}</th>
                  <th scope="col">{t("blog.category")}</th>
                  <th scope="col">{t("status")}</th>
                  <th scope="col">{t("blog.date")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="name-cell">
                        <Link href={`/admin/blog/${row.id}`} className="row-link">{localized(row.title, locale) || row.slug}</Link>
                        {row.isFeatured ? (
                          <span title={t("blog.featuredShort")}>
                            <Icon name="star" size={16} />
                            <span className="sr-only">{t("blog.featuredShort")}</span>
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{row.categoryName ? localized(row.categoryName, locale) : "—"}</td>
                    <td><Status tone={STATE_TONE[row.state]}>{t(`blog.states.${row.state}`)}</Status></td>
                    <td className="nowrap muted">
                      {row.publishedAt ? format.dateTime(new Date(row.publishedAt), { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
