"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

/** Renders children only after mount so browser extensions cannot mutate SSR form markup. */
export function ClientOnly({ children, fallback = null }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return fallback;
  return children;
}

export function FormLoadingShell() {
  return (
    <div
      className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-lg md:p-10"
      aria-busy="true"
      aria-label="Loading form"
    >
      <div className="h-6 w-36 animate-pulse rounded bg-gray-100" />
      <div className="mt-4 h-9 w-56 animate-pulse rounded bg-gray-100" />
      <div className="mt-8 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
        </div>
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
