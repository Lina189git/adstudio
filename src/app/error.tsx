"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#faf6ef] px-6 text-center">
      <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-10 shadow-sm max-w-md w-full">
        <p className="text-4xl font-bold text-[#1a1614]">Something went wrong</p>
        <p className="mt-3 text-sm text-[#8c7764]">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-[#c0b4aa]">Ref: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-[#1a1614] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-[#eadfcb] px-6 py-3 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
