import { ReactNode } from "react";

interface AdminShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function AdminShell({
  eyebrow,
  title,
  description,
  children,
}: AdminShellProps) {
  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-[#e3d5be] bg-[radial-gradient(circle_at_top_left,_rgba(212,165,116,0.22),_transparent_38%),linear-gradient(135deg,#fffaf2_0%,#f5ede0_45%,#efe2cf_100%)] px-8 py-10 shadow-[0_24px_70px_rgba(26,22,20,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#a87945]">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[#1a1614] md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[#5d5148] md:text-base">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}
