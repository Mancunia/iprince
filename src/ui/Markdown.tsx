import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "./cn";

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Allows http(s), mailto, tel and scheme-less (relative, #anchor) URLs; anything else becomes an empty href. */
export function safeUrl(url: string): string {
  if (!SCHEME.test(url)) return url;
  return /^(https?|mailto|tel):/i.test(url) ? url : "";
}

/** Admin-authored markdown. Raw HTML is skipped entirely, so stored text can never inject markup or script. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={safeUrl}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
