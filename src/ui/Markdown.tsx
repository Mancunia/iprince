import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "./cn";

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Allows http(s), mailto, tel and scheme-less (relative, #anchor) URLs; anything else becomes an empty href. */
export function safeUrl(url: string): string {
  if (!SCHEME.test(url)) return url;
  return /^(https?|mailto|tel):/i.test(url) ? url : "";
}

const components: Components = {
  // The page renders its own h1; a "# heading" in the text becomes a section heading.
  h1: ({ node, ...props }) => {
    void node;
    return <h2 {...props} />;
  },
  a: ({ node, href, ...props }) => {
    void node;
    return /^https?:/i.test(href ?? "") ? <a href={href} target="_blank" rel="noopener noreferrer" {...props} /> : <a href={href} {...props} />;
  },
  img: ({ node, src, alt, ...props }) => {
    void node;
    if (!src) return null;
    // eslint-disable-next-line @next/next/no-img-element -- markdown images may come from any host
    return <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" {...props} />;
  },
  table: ({ node, ...props }) => {
    void node;
    return (
      <div className="overflow-x-auto">
        <table {...props} />
      </div>
    );
  },
};

/** Admin-authored markdown. Raw HTML is skipped entirely, so stored text can never inject markup or script. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={safeUrl} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
