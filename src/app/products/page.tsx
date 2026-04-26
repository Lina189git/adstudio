import Link from "next/link";
import AppHeader from "@/components/painting-order/AppHeader";
import ProductGrid from "@/components/products/ProductGrid";
import CategoryFilter from "@/components/products/CategoryFilter";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Oil Paintings | Professional Art Collection",
  description: "Browse our collection of professionally crafted oil paintings. Choose from portraits, landscapes, abstracts, and more with custom sizing and framing options.",
};

async function getCategories() {
  try {
    return await prisma.category.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function getProducts(searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
    const search = typeof searchParams.search === "string" ? searchParams.search : undefined;

    const where: {
      isActive: boolean;
      category?: { slug: string };
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      isActive: true,
    };

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            where: { isActive: true },
            orderBy: { priceCents: "asc" },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page: 1,
        limit: products.length,
        total,
        pages: total > 0 ? 1 : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], pagination: { total: 0, pages: 0 } };
  }
}

interface ProductsPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [categories, productsData] = await Promise.all([
    getCategories(),
    getProducts(searchParams || {}),
  ]);

  const { products, pagination } = productsData;

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#1a1614]">
      <AppHeader />

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d54]">
              Professional art collection
            </div>
            <h1 className="mt-3 text-4xl font-bold">
              Oil Paintings for Every Space
            </h1>
            <p className="mt-3 max-w-3xl text-[#6b5d54]">
              Discover our curated collection of handcrafted oil paintings. Each piece is professionally created
              with premium materials and available in multiple sizes with custom framing options.
            </p>
          </div>
          <Link
            href="/painting-order/upload"
            className="rounded-2xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2a2624] transition-colors"
          >
            Create Custom Painting
          </Link>
        </div>

        <CategoryFilter categories={categories} />

        {products.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border-2 border-[#eadfcb] bg-white p-10 text-center text-[#6b5d54]">
            <p className="text-lg">No products found matching your criteria.</p>
            <p className="mt-2">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <ProductGrid products={products} />
            {pagination.pages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex gap-2">
                  {/* Pagination would go here */}
                  <span className="text-sm text-[#6b5d54]">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
