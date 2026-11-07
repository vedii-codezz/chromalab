"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

/** Presentation only: leaves server content visible and never touches project data. */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          gsap.from("[data-reveal]", {
            y: 22,
            opacity: 0,
            duration: 0.85,
            stagger: 0.09,
            ease: "power3.out",
            clearProps: "transform,opacity",
          });
        },
        root,
      );
    }, root);
    return () => {
      media.revert();
      context.revert();
    };
  }, []);
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
