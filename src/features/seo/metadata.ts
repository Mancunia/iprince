import "server-only";
import { getTranslations } from "next-intl/server";
import { DEFAULT_OG_IMAGE, pageMetadata, type PageInput } from "@/lib/seo";

/** pageMetadata with the localized site name and the logo as the fallback share image. */
export async function sitePageMetadata(input: Omit<PageInput, "siteName">) {
  const t = await getTranslations({ locale: input.locale, namespace: "metadata" });
  return pageMetadata({ ...input, image: input.image ?? DEFAULT_OG_IMAGE, siteName: t("title") });
}
