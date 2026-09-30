import { useTranslations } from "next-intl";
import Icon from "./Icon";
import { site } from "@/lib/site";

export default function LegalStrip() {
  const t = useTranslations("site.legalStrip");
  return (
    <div className="legal-strip">
      <div className="container legal-strip-inner">
        <div className="legal-strip-items">
          <span>
            <Icon name="badge-check" />
            {t("licensed")}
          </span>
          <span>
            <Icon name="shield-check" />
            {t("gdpr")}
          </span>
        </div>
        <a href={site.phoneHref}>{site.phoneDisplay}</a>
      </div>
    </div>
  );
}
