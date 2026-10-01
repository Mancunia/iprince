"use client";

import { useEffect } from "react";

/** Marks the sticky site header once the page has scrolled, so CSS can add a shadow. */
export function HeaderShadow() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    const update = () => header.toggleAttribute("data-scrolled", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}
