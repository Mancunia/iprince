import * as stylex from "@stylexjs/stylex";

export const color = stylex.defineVars({
  bg: "#ffffff",
  surface: "#f5f5f3",
  text: "#161616",
  textMuted: "#5c5c5c",
  border: "#d0d0cc",
  accent: "#1f4fd1",
  accentText: "#ffffff",
  danger: "#b3261e",
  success: "#1e7a3c",
});

export const space = stylex.defineVars({ xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "40px" });
export const radius = stylex.defineVars({ sm: "4px", md: "8px" });
export const font = stylex.defineVars({
  body: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  sizeSm: "0.875rem",
  sizeMd: "1rem",
  sizeLg: "1.25rem",
  sizeXl: "1.75rem",
});
