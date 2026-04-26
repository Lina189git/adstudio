import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import AppHeader from "@/components/painting-order/AppHeader";
import {
  ArrowLeft,
  Calendar,
  KeyRound,
  Mail,
  Settings,
  ShoppingCart,
  User,
  Package,
  Shield,
} from "lucide-react";

async function getAccountSummary(userId: string) {
  const [account, paidSummary] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        password: true,
        createdAt: true,
        accounts: {
          select: {
            provider: true,
          },
        },
        _count: {
          select: {
            orders: true,
            cartItems: true,
          },
        },
      },
    }),
    prisma.paintingOrder.aggregate({
      where: {
        userId,
        paymentStatus: "PAID",
      },
      _sum: {
        amountCents: true,
      },
    }),
  ]);

  return {
    account,
    totalSpentCents: paidSummary._sum.amountCents || 0,
  };
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface AccountPageProps {
  searchParams?: {
    welcome?: string;
  };
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/account");
  }

  const { account, totalSpentCents } = await getAccountSummary(session.user.id);

  if (!account) {
    redirect("/auth/signin?callbackUrl=/account");
  }

  const role = account.role || session.user.role || "USER";

  const authMethods = [
    ...(account.password ? ["Email and password"] : []),
    ...account.accounts.map((entry) =>
      entry.provider === "google" ? "Google" : entry.provider
    ),
  ];

  const overviewItems = [
    {
      label: "Orders Placed",
      value: String(account._count.orders),
    },
    {
      label: "Cart Items",
      value: String(account._count.cartItems),
    },
    {
      label: "Total Spent",
      value: formatMoney(totalSpentCents),
    },
    {
      label: "Account Status",
      value: "Active",
    },
  ];
  const quickActions = [
    { href: "/orders", label: "View Orders", primary: false },
    { href: "/cart", label: "Open Cart", primary: false },
    { href: "/painting-order", label: "Create New Order", primary: true },
    ...(role === "ADMIN"
      ? [{ href: "/admin", label: "Open Admin Dashboard", primary: false }]
      : []),
  ];
  const userId = account.id || session.user.id;

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <AppHeader />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#6b5d54] hover:text-[#1a1614] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {searchParams?.welcome === "1" ? (
            <div className="mb-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              Your account is ready. Your user ID is shown below in the account summary.
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-[#e3d5be] bg-[radial-gradient(circle_at_top_left,_rgba(212,165,116,0.2),_transparent_35%),linear-gradient(135deg,#fffaf2_0%,#f4ebde_100%)] p-8 shadow-[0_24px_70px_rgba(26,22,20,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a87945]">
              My Account
            </p>
            <h1 className="mt-4 text-3xl font-bold text-[#1a1614]">
              Account Overview
            </h1>
            <p className="mt-3 max-w-3xl text-[#5d5148]">
              Review your profile, sign-in methods, order activity, and account access from one place.
            </p>
            <div className="mt-5 inline-flex flex-col rounded-2xl border border-[#e3d5be] bg-white/70 px-4 py-3 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c7764]">
                User ID
              </span>
              <span className="mt-1 break-all font-mono text-sm text-[#1a1614]">
                {userId}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="bg-white rounded-[1.75rem] border-2 border-[#eadfcb] p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h2 className="text-xl font-semibold text-[#1a1614] mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </h2>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {account.image ? (
                    <img
                      src={account.image}
                      alt={account.name || "Profile"}
                      className="w-16 h-16 rounded-full border-2 border-[#eadfcb]"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#f8f1e6] rounded-full flex items-center justify-center border-2 border-[#eadfcb]">
                      <User className="w-8 h-8 text-[#6b5d54]" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-[#1a1614]">
                      {account.name || "Unnamed account"}
                    </h3>
                    <p className="text-[#6b5d54] flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {account.email}
                    </p>
                    <div className="mt-3">
                      <span
                        className="inline-flex rounded-full bg-[#f8f1e6] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]"
                      >
                        {role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7764]">
                      Authentication Methods
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(authMethods.length ? authMethods : ["Session account"]).map(
                        (method) => (
                          <span
                            key={method}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#1a1614] border border-[#eadfcb]"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            {method}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7764]">
                      Membership
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-[#1a1614]">
                      <Calendar className="w-4 h-4 text-[#6b5d54]" />
                      Member since{" "}
                      {new Date(account.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </div>
                    <div className="mt-3 border-t border-[#eadfcb] pt-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">
                        User ID
                      </p>
                      <p className="mt-2 break-all font-mono text-sm text-[#1a1614]">
                        {userId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.75rem] border-2 border-[#eadfcb] p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h2 className="text-xl font-semibold text-[#1a1614] mb-6 flex items-center gap-2">
                {role === "ADMIN" ? <Shield className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                Quick Actions
              </h2>

              <div className="grid gap-3 md:grid-cols-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`block rounded-[1.25rem] px-4 py-4 text-center font-semibold transition ${
                      action.primary
                        ? "bg-[#1a1614] text-white hover:bg-[#2a2624]"
                        : "bg-[#f8f1e6] text-[#1a1614] hover:bg-[#eadfcb]"
                    }`}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[1.75rem] border-2 border-[#eadfcb] p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h2 className="text-xl font-semibold text-[#1a1614] mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Overview
              </h2>

              <div className="space-y-4">
                {overviewItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3"
                  >
                    <span className="text-[#6b5d54]">{item.label}</span>
                    <span className="font-semibold text-[#1a1614]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[1.75rem] border-2 border-[#eadfcb] p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h3 className="text-lg font-semibold text-[#1a1614] mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Account Notes
              </h3>

              <p className="text-sm leading-6 text-[#5d5148]">
                This page is your central account summary for profile details, authentication methods, order activity, and quick storefront access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
