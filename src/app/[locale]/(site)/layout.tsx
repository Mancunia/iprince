import { GoogleAnalytics } from "@/features/analytics/GoogleAnalytics";
import { SiteAnalytics } from "@/features/analytics/SiteAnalytics";
import { ChatChannel } from "@/features/site/ChatChannel";
import { CookieBanner } from "@/features/site/CookieBanner";
import { SiteFooter } from "@/features/site/SiteFooter";
import { SiteHeader } from "@/features/site/SiteHeader";
import { getIntegrations } from "@/features/site-settings/queries";
import { gaEnabled } from "@/features/site-settings/settings";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const integrations = getIntegrations();
  const { cookieScriptId } = integrations;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter cookieSettings={Boolean(cookieScriptId)} />
      <ChatChannel />
      {cookieScriptId ? <CookieBanner id={cookieScriptId} /> : null}
      {gaEnabled(integrations) ? <GoogleAnalytics id={integrations.gaId} /> : null}
      <SiteAnalytics />
    </div>
  );
}
