import { jsonLdString } from "@/lib/seo";

/** Structured data for search engines (Next JSON-LD guide). */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
