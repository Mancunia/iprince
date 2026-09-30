import Image from "next/image";

/** Renders a Lucide SVG from /public/icons. Decorative only. */
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <Image src={`/icons/${name}.svg`} alt="" aria-hidden width={size} height={size} unoptimized />;
}
