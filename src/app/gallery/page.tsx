import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Package, Star } from "lucide-react";
import UserMenu from "@/components/UserMenu";

export const dynamic = "force-dynamic";

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const pct = (r: number) => `${(r * 100).toFixed(0)}%`;

async function getProducts(search: string, category: string) {
  const where = {
    isActive: true,
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] } : {}),
    ...(category ? { category: { slug: category } } : {}),
  };
  return prisma.product.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: { category: { select: { name: true, slug: true } } },
    take: 48,
  });
}

async function getCategories() {
  return prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

export default async function GalleryPage({ searchParams }: { searchParams: { search?: string; category?: string } }) {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;

  const [products, categories] = await Promise.all([
    getProducts(searchParams.search || "", searchParams.category || ""),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#eadfcb] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold tracking-tight text-[#1a1614]">AdStudio</Link>
            <nav className="hidden items-center gap-5 text-sm font-medium text-[#6b5d54] md:flex">
              <Link href="/gallery" className="font-semibold text-[#1a1614]">Gallery</Link>
              <Link href="/#how-it-works" className="hover:text-[#1a1614]">How it works</Link>
              {isLoggedIn && <Link href="/influencer/dashboard" className="hover:text-[#1a1614]">My dashboard</Link>}
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[#1a1614] md:text-5xl">Product Gallery</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#6b5d54]">
            Discover products to promote. Apply to receive a free sample, create your video ad, and earn commission.
          </p>
          {!isLoggedIn && (
            <Link href="/auth/signin?signup=1" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1a1614] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2a2624]">
              Sign up to apply
            </Link>
          )}
        </div>

        {/* Filters */}
        <form method="GET" className="mb-8 flex flex-col gap-3 sm:flex-row">
          <input name="search" defaultValue={searchParams.search || ""} placeholder="Search products..." className="flex-1 rounded-xl border border-[#eadfcb] bg-white px-4 py-3 text-sm outline-none focus:border-[#d4a574]" />
          <select name="category" defaultValue={searchParams.category || ""} className="rounded-xl border border-[#eadfcb] bg-white px-4 py-3 text-sm outline-none focus:border-[#d4a574]">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <button type="submit" className="rounded-xl bg-[#1a1614] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2a2624]">Search</button>
        </form>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="py-20 text-center text-[#6b5d54]">No products found. Try a different search.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const commission = product.commissionType === "FIXED"
                ? money(product.commissionFixed)
                : `${pct(product.commissionRate)} of sale`;
              return (
                <Link key={product.id} href={`/gallery/${product.slug}`} className="group overflow-hidden rounded-[1.75rem] border border-[#eadfcb] bg-white shadow-[0_4px_20px_rgba(26,22,20,0.04)] transition hover:shadow-[0_12px_40px_rgba(26,22,20,0.10)]">
                  <div className="relative overflow-hidden bg-[#faf6ef]">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center"><Package className="h-10 w-10 text-[#d9ccb9]" /></div>
                    )}
                    {product.isFeatured && (
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-[#1a1614] px-3 py-1 text-xs font-semibold text-white">
                        <Star className="h-3 w-3 fill-white" />Featured
                      </div>
                    )}
                    {product.sampleStock === 0 && (
                      <div className="absolute right-3 top-3 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Samples out</div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7764]">{product.category.name}</p>
                    <p className="mt-1 font-bold text-[#1a1614] line-clamp-2">{product.name}</p>
                    {product.shortDescription && <p className="mt-1.5 text-sm text-[#6b5d54] line-clamp-2">{product.shortDescription}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Earn {commission}</span>
                      <span className="text-xs text-[#a89a8e]">{product.sampleStock} samples left</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
