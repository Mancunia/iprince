"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { track } from "@/features/analytics/track";
import { cn } from "@/ui/cn";
import { Icon } from "@/ui/Icon";
import { SHARE_TARGETS, shareLinks, type ShareTarget } from "./share";

const noSubscribe = () => () => {};

const ICON: Record<ShareTarget, string> = { linkedin: "linkedin", facebook: "facebook", x: "x-logo", xing: "xing", email: "mail" };

/** Share buttons for an article: the phone's share sheet where there is one, the networks, email and copy link. */
export function ShareBar({ url, title, compact = false, className }: { url: string; title: string; compact?: boolean; className?: string }) {
  const t = useTranslations("blog.share");
  const links = shareLinks(url, title);
  // navigator.share only exists in the browser (mostly phones): false on the server, so the button appears after hydration.
  const canShare = useSyncExternalStore(noSubscribe, () => typeof navigator.share === "function", () => false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function shareNative() {
    try {
      await navigator.share({ title, url });
      track("post_shared", { channel: "native" });
    } catch {
      // Dismissed sheet (AbortError) or blocked: nothing to do.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track("post_shared", { channel: "copy" });
    } catch {
      // Clipboard denied: the address bar still has the link.
    }
  }

  return (
    <div role="group" aria-label={t("title")} className={cn("flex flex-wrap items-center gap-2", className)}>
      {compact ? null : <h2 className="mr-2 text-base font-semibold">{t("title")}</h2>}
      {canShare ? (
        <button type="button" onClick={shareNative} className="btn btn-sm">
          <Icon name="share-2" size={16} />
          {t("native")}
        </button>
      ) : null}
      {SHARE_TARGETS.map((target) => (
        <a
          key={target}
          href={links[target]}
          {...(target === "email" ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          onClick={() => track("post_shared", { channel: target })}
          aria-label={t(target)}
          title={t(target)}
          className="btn btn-ghost btn-sm btn-icon"
        >
          <Icon name={ICON[target]} size={16} />
        </a>
      ))}
      <button type="button" onClick={copy} className="btn btn-ghost btn-sm">
        <Icon name={copied ? "check" : "link"} size={16} />
        <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
      </button>
    </div>
  );
}
