import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckCircle2, DollarSign, Package, TrendingUp, Video } from "lucide-react";
import SignInForm from "@/components/SignInForm";

export const metadata: Metadata = {
  title: "Sign In — AdStudio",
  description: "Sign in or create a free AdStudio account to apply for products, submit ad videos, and earn commission.",
};

const PERKS = [
  "Apply to promote products you love",
  "Receive free product samples to review",
  "Submit your ad videos for brand approval",
  "Earn commission on every approved video",
];

const STATS = [
  { icon: Package,    label: "Products listed",   value: "Ready to promote"    },
  { icon: Video,      label: "Videos published",  value: "Growing library"     },
  { icon: DollarSign, label: "Commissions paid",  value: "Fair & transparent"  },
  { icon: TrendingUp, label: "Creator network",   value: "Join today"          },
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { signup?: string; callbackUrl?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session) redirect(searchParams.callbackUrl || "/auth/redirect");

  const isSignUp = searchParams.signup === "1";

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">

        {/* ── Left: brand panel ── */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#1a1614] px-14 py-12">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "radial-gradient(ellipse at 20% 70%, rgba(212,165,116,0.18) 0%, transparent 60%)" }}
          />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a574]">
              <TrendingUp className="h-5 w-5 text-[#1a1614]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">AdStudio</span>
          </div>

          {/* Main copy */}
          <div className="relative z-10 space-y-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-semibold text-white/70">
                <Video className="h-3.5 w-3.5 text-[#d4a574]" />
                Product advertisement platform
              </span>
              <h2 className="mt-5 text-4xl font-bold leading-[1.15] text-white">
                Turn products into<br />
                <span className="text-[#d4a574]"> video ads.</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/55">
                Apply for free samples, create authentic content,<br />
                and earn commission. Brands get real ads. Creators get paid.
              </p>
            </div>

            {/* Perks */}
            <ul className="space-y-3">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-sm text-white/75">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#d4a574]" />
                  {perk}
                </li>
              ))}
            </ul>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm">
                  <Icon className="mb-2 h-4 w-4 text-[#d4a574]" />
                  <p className="text-sm font-semibold text-white">{value}</p>
                  <p className="text-[11px] text-white/45">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/20">© {new Date().getFullYear()} AdStudio</p>
        </div>

        {/* ── Right: form panel ── */}
        <div className="flex flex-col justify-center bg-white px-8 py-12 sm:px-12">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1614]">
              <TrendingUp className="h-5 w-5 text-[#d4a574]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1a1614]">AdStudio</span>
          </div>

          {/* Heading — changes by mode */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d4a574]">
              {isSignUp ? "Free influencer account" : "Creator & brand access"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1a1614]">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-[#6b5d54]">
              {isSignUp
                ? "Join AdStudio and start applying for products to promote today."
                : "Sign in to manage your applications, tasks, and earnings."}
            </p>
          </div>

          <SignInForm initialMode={isSignUp ? "signup" : "signin"} />
        </div>
      </div>
    </div>
  );
}
