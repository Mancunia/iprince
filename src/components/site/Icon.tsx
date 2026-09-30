import type { CSSProperties } from "react";

// Lucide icon (stroke 1.5) rendered as a CSS mask so it takes currentColor.
export default function Icon({
  name,
  size,
  style,
}: {
  name: string;
  size?: "sm" | "lg" | "xl";
  style?: CSSProperties;
}) {
  const url = `url(/icons/${name}.svg)`;
  return (
    <span
      className={size ? `i i-${size}` : "i"}
      style={{ maskImage: url, WebkitMaskImage: url, ...style }}
      aria-hidden="true"
    />
  );
}
