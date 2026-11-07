"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Native disclosure behavior; only viewport changes reset the initial layout. */
export function ResponsivePanel({
  children,
  className,
  collapseAt,
  testId,
}: {
  children: ReactNode;
  className: string;
  collapseAt: number;
  testId?: string;
}) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${collapseAt}px)`);
    const update = () => {
      if (panel.current) panel.current.open = !query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [collapseAt]);
  return (
    <details ref={panel} className={className} open data-testid={testId}>
      {children}
    </details>
  );
}
