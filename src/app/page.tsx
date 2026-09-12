import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ArrowRight, CheckCircle, Package, PlayCircle, Star, TrendingUp, Upload, Video } from "lucide-react";
import UserMenu from "@/components/UserMenu";

export const dynamic = "force-dynamic";

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } } },
    });
  } catch { return []; }
}

async function getPublicVideos() {
  try {
    return await prisma.videoSubmission.findMany({
      where: { isPublic: true, status: "PUBLISHED" },
      take: 6,
      orderBy: { approvedAt: "desc" },
      include: {
        influencer: { select: { name: true, image: true } },
        task: { include: { application: { include: { product: { select: { name: true, imageUrl: true } } } } } },
      },
    });
  } catch { return []; }
}

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const pct = (r: number) => `${(r * 100).toFixed(0)}%`;

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const role = session ? (session.user as { role?: string }).role : null;
  const isLoggedIn = !!session;

  const [featuredProducts, publicVideos] = await Promise.all([getFeaturedProducts(), getPublicVideos()]);

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[#eadfcb] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#1a1614]">AdStudio</Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#6b5d54] md:flex">
            <Link href="/gallery" className="hover:text-[#1a1614]">Product gallery</Link>
            <Link href="#how-it-works" className="hover:text-[#1a1614]">How it works</Link>
            {isLoggedIn && <Link href="/influencer/dashboard" className="hover:text-[#1a1614]">Dashboard</Link>}
          </nav>
          <UserMenu />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1a1614] py-24 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 60% 40%, #d4a574 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
                <Star className="h-4 w-4 fill-[#d4a574] text-[#d4a574]" />Product advertisement platform
              </div>
              <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl">
                Turn products into<br /><span className="text-[#d4a574]">viral video ads</span>
              </h1>
              <p className="mt-6 text-xl text-white/70">
                Connect brands with talented video creators. Influencers apply, receive free samples, create authentic videos, and earn commission.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                {isLoggedIn ? (
                  <>
                    <Link href={role === "ADMIN" ? "/admin" : "/influencer/dashboard"} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d4a574] px-8 py-4 text-base font-semibold text-[#1a1614] hover:bg-[#c49464]">
                      {role === "ADMIN" ? "Admin dashboard" : "My dashboard"} <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link href="/gallery" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white hover:bg-white/10">
                      Browse products <TrendingUp className="h-5 w-5" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signin?signup=1" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d4a574] px-8 py-4 text-base font-semibold text-[#1a1614] hover:bg-[#c49464]">
                      Start creating free <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link href="/auth/signin" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white hover:bg-white/10">
                      Sign in <TrendingUp className="h-5 w-5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {featuredProducts.map((p) => (
                <div key={p.id} className="group relative overflow-hidden rounded-[1.5rem] border border-white/10">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-white/10"><Package className="h-8 w-8 text-white/40" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-xs font-semibold text-white/70">{p.category.name}</p>
                    <p className="text-sm font-bold text-white line-clamp-1">{p.name}</p>
                  </div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 4 - featuredProducts.length) }).map((_, i) => (
                <div key={`ph-${i}`} className="aspect-square rounded-[1.5rem] border border-white/10 bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-[#eadfcb] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 text-center md:grid-cols-3">
            {[
              { value: "Free samples", label: "Influencers receive products at no cost" },
              { value: "Fair commission", label: "Earn per-sale percentage or fixed fee" },
              { value: "Fast approval", label: "Admin reviews and approves your video" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-[#1a1614]">{stat.value}</p>
                <p className="mt-2 text-sm text-[#6b5d54]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-bold text-[#1a1614]">How it works</h2>
            <p className="mt-4 text-lg text-[#6b5d54]">Simple workflow from product listing to published video ad</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", icon: Package, title: "Brand lists product", description: "Store owners upload products with photos, descriptions, commission rates, and sample stock details." },
              { step: "02", icon: Upload, title: "Influencer applies", description: "Creators browse the gallery, choose products that fit their audience, and submit a pitch application." },
              { step: "03", icon: Video, title: "Make the video", description: "Approved influencers receive a free sample, follow the task brief, and upload their ad video for review." },
              { step: "04", icon: TrendingUp, title: "Earn commission", description: "Admin reviews and publishes the video. Commission is approved and paid per the agreed terms." },
            ].map((item) => (
              <div key={item.step} className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.04)]">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-4xl font-bold text-[#eadfcb]">{item.step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#faf6ef]">
                    <item.icon className="h-5 w-5 text-[#8c7764]" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#1a1614]">{item.title}</h3>
                <p className="mt-2 text-sm text-[#6b5d54]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-4xl font-bold text-[#1a1614]">Featured products</h2>
                <p className="mt-2 text-[#6b5d54]">High-commission products looking for talented creators</p>
              </div>
              <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8c7764] hover:text-[#1a1614]">View all <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => {
                const commission = product.commissionType === "FIXED" ? money(product.commissionFixed) : `${pct(product.commissionRate)} of sale`;
                return (
                  <Link key={product.id} href={`/gallery/${product.slug}`} className="group overflow-hidden rounded-[1.75rem] border border-[#eadfcb] bg-[#faf6ef] transition hover:shadow-[0_12px_40px_rgba(26,22,20,0.10)]">
                    <div className="overflow-hidden">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt={product.name} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-[#f0e8d8]"><Package className="h-8 w-8 text-[#d9ccb9]" /></div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7764]">{product.category.name}</p>
                      <p className="mt-1 font-bold text-[#1a1614] line-clamp-2">{product.name}</p>
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle className="h-3.5 w-3.5" />Earn {commission}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Published videos showcase */}
      {publicVideos.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-bold text-[#1a1614]">Live ad videos</h2>
              <p className="mt-3 text-[#6b5d54]">Real content created by our influencer community</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publicVideos.map((video) => (
                <a key={video.id} href={video.videoUrl} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-[1.75rem] border border-[#eadfcb] bg-white shadow-[0_4px_20px_rgba(26,22,20,0.04)] transition hover:shadow-[0_12px_40px_rgba(26,22,20,0.10)]">
                  <div className="relative aspect-video overflow-hidden bg-[#1a1614]">
                    {video.thumbnailUrl ? (
                      <Image src={video.thumbnailUrl} alt={video.title} fill sizes="(max-width:640px) 100vw,33vw" className="object-cover opacity-80 transition group-hover:opacity-100" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Video className="h-10 w-10 text-white/30" /></div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="h-14 w-14 text-white/80 transition group-hover:scale-110 group-hover:text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-[#1a1614] line-clamp-2">{video.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {video.influencer.image && (
                        <div className="relative h-6 w-6 overflow-hidden rounded-full border border-[#eadfcb]">
                          <Image src={video.influencer.image} alt={video.influencer.name || ""} fill sizes="24px" className="object-cover" />
                        </div>
                      )}
                      <p className="text-xs text-[#8c7764]">{video.influencer.name}</p>
                      <span className="text-[#d9ccb9]">·</span>
                      <p className="text-xs text-[#a89a8e] line-clamp-1">{video.task.application.product.name}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[#1a1614] py-24 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-bold">Ready to start creating?</h2>
          <p className="mt-4 text-xl text-white/70">Browse products, apply for free samples, and earn commission on every approved video.</p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {isLoggedIn ? (
              <>
                <Link href={role === "ADMIN" ? "/admin" : "/influencer/dashboard"} className="rounded-full bg-[#d4a574] px-8 py-4 text-base font-semibold text-[#1a1614] hover:bg-[#c49464]">
                  {role === "ADMIN" ? "Go to admin" : "Go to dashboard"}
                </Link>
                <Link href="/gallery" className="rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white hover:bg-white/10">
                  Browse products
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin?signup=1" className="rounded-full bg-[#d4a574] px-8 py-4 text-base font-semibold text-[#1a1614] hover:bg-[#c49464]">
                  Create free account
                </Link>
                <Link href="/auth/signin" className="rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white hover:bg-white/10">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#eadfcb] bg-white py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="text-lg font-bold text-[#1a1614]">AdStudio</Link>
            <div className="flex flex-wrap gap-6 text-sm text-[#6b5d54]">
              <Link href="/gallery" className="hover:text-[#1a1614]">Gallery</Link>
              <Link href="/influencer/dashboard" className="hover:text-[#1a1614]">Dashboard</Link>
              <Link href="/admin" className="hover:text-[#1a1614]">Admin</Link>
              <Link href="/terms" className="hover:text-[#1a1614]">Terms</Link>
              <Link href="/privacy" className="hover:text-[#1a1614]">Privacy</Link>
            </div>
            <p className="text-sm text-[#a89a8e]">© {new Date().getFullYear()} AdStudio</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
