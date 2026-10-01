import Image from "next/image";
import { Icon } from "@/ui/Icon";
import { cn } from "@/ui/cn";

type Props = { src: string | null; alt: string; className?: string; sizes?: string; priority?: boolean; icon?: string };

/** Rounded photo; a tinted placeholder (with `icon`) while there is no photo. Size it with an aspect-* class. */
export function Photo({ src, alt, className, sizes = "(min-width: 860px) 50vw, 100vw", priority, icon = "user" }: Props) {
  return (
    <div className={cn("photo", !src && "photo-ph", className)}>
      {src ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} /> : <Icon name={icon} size={36} />}
    </div>
  );
}
