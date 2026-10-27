export const SHARE_TARGETS = ["linkedin", "facebook", "x", "xing", "email"] as const;
export type ShareTarget = (typeof SHARE_TARGETS)[number];

const query = (params: Record<string, string>) => new URLSearchParams(params).toString();

/** Share links for one article. Plain links, no third-party scripts, so nothing needs consent. */
export function shareLinks(url: string, title: string): Record<ShareTarget, string> {
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?${query({ url })}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?${query({ u: url })}`,
    x: `https://x.com/intent/post?${query({ url, text: title })}`,
    xing: `https://www.xing.com/spi/shares/new?${query({ url })}`,
    // mailto wants %20, not URLSearchParams' "+".
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  };
}
