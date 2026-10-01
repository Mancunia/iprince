import Image from "next/image";
import { Icon } from "@/ui/Icon";
import { cn } from "@/ui/cn";

type Props = { src: string | null; alt: string; className?: string; sizes?: string; priority?: boolean };

/** Rounded photo; a tinted placeholder while no photo is uploaded for the slot. Size it with an aspect-* class. */
export function Photo({ src, alt, className, sizes = "(min-width: 860px) 50vw, 100vw", priority }: Props) {
  return (
    <div className={cn("photo", !src && "photo-ph", className)}>
      {src ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} /> : <Icon name="user" size={36} />}
    </div>
  );
}
