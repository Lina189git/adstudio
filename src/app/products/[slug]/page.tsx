import { notFound } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/painting-order/AppHeader";
import ProductDetail from "@/components/products/ProductDetail";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/products/${slug}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch product');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} | Oil Paintings`,
    description: product.shortDescription || product.description || `Professional oil painting: ${product.name}`,
    openGraph: {
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8f1e6] text-[#1a1614]">
      <AppHeader />

      <section className="mx-auto max-w-7xl px-6 py-14">
        <ProductDetail product={product} />
      </section>
    </div>
  );
}