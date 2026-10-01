import { cn } from "./cn";

const SIZES: Record<number, string> = { 16: "i-sm", 20: "", 28: "i-lg", 36: "i-xl" };

/** Renders a Lucide SVG from /public/icons as a CSS mask, so it takes currentColor. Decorative only. */
export function Icon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const sized = size in SIZES ? undefined : { width: size, height: size };
  const mask = `url(/icons/${encodeURIComponent(name)}.svg)`;
  return <span aria-hidden="true" className={cn("i", SIZES[size], className)} style={{ ...sized, maskImage: mask, WebkitMaskImage: mask }} />;
}
