import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/ui/Icon";
import type { BlogCta } from "./schema";

const TARGET = { candidates: "/#berufe", employers: "/employers" } as const;

/** The category's call to action under the article; nothing for "none" or uncategorized posts. */
export async function PostCta({ cta }: { cta: BlogCta }) {
  if (cta === "none") return null;
  const t = await getTranslations("blog.cta");
  return (
    <aside className="card max-w-[72ch] gap-4 p-6 md:p-8">
      <h2 className="text-2xl">{t(`${cta}.title`)}</h2>
      <p className="text-fg-muted">{t(`${cta}.text`)}</p>
      <Link href={TARGET[cta]} className="btn btn-primary max-w-max">
        {t(`${cta}.button`)}
        <Icon name="arrow-right" />
      </Link>
    </aside>
  );
}
