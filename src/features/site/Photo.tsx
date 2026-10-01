import Image from "next/image";
import { Icon } from "@/ui/Icon";
import { cn } from "@/ui/cn";
import { PHOTOS, type PhotoSlot } from "./photos";

type Props = { slot: PhotoSlot; alt: string; className?: string; sizes?: string; priority?: boolean };

/** Rounded photo; a tinted placeholder until the slot has a file in photos.ts. Size it with an aspect-* class. */
export function Photo({ slot, alt, className, sizes = "(min-width: 860px) 50vw, 100vw", priority }: Props) {
  const src = PHOTOS[slot];
  return (
    <div className={cn("photo", !src && "photo-ph", className)}>
      {src ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} /> : <Icon name="user" size={36} />}
    </div>
  );
}
