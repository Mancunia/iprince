import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { locales, type Locale } from "@/i18n/config";
import { getLivePost } from "@/features/blog/queries";
import { localizePost } from "@/features/blog/text";
import { localized } from "@/lib/i18n/localized";

const logo = readFile(join(process.cwd(), "public/logo/iprince-mark.png")).then((png) => `data:image/png;base64,${png.toString("base64")}`);

// Brand tokens (src/styles/tokens.css): accent-900 background, gold-400 rule and kicker.
const NAVY = "#0e1f3a";
const GOLD = "#d9b366";

/** 1200×630 share card (title, category, logo) for posts without a cover image. */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return new Response(null, { status: 404 });
  const post = await getLivePost(slug);
  if (!post) return new Response(null, { status: 404 });
  const [t, src] = await Promise.all([getTranslations({ locale, namespace: "metadata" }), logo]);
  const { title } = localizePost(post, locale as Locale);
  const kicker = post.category ? localized(post.category.name, locale as Locale) : "Blog";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 72, background: NAVY, color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
          <img src={src} width={84} height={72} alt="" />
          <span style={{ fontSize: 34 }}>{t("title")}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span style={{ fontSize: 28, color: GOLD, textTransform: "uppercase", letterSpacing: 2 }}>{kicker}</span>
          <span style={{ fontSize: title.length > 70 ? 56 : 68, lineHeight: 1.15 }}>{title}</span>
        </div>
        <div style={{ display: "flex", width: 160, height: 8, background: GOLD, borderRadius: 4 }} />
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
