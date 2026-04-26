"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: {
    products: number;
  };
}

interface CategoryFilterProps {
  categories: Category[];
}

export default function CategoryFilter({ categories }: CategoryFilterProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');
  const currentSearch = searchParams.get('search');

  const [searchQuery, setSearchQuery] = useState(currentSearch || '');

  const createHref = (categorySlug?: string, search?: string) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set('category', categorySlug);
    if (search) params.set('search', search);
    return `/products${params.toString() ? `?${params.toString()}` : ''}`;
  };

  return (
    <div className="mb-8">
      {/* Search Bar */}
      <div className="mb-6">
        <form className="flex gap-4">
          <input
            type="text"
            placeholder="Search paintings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-[#eadfcb] rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#d4a574] focus:border-transparent"
          />
          <Link
            href={createHref(currentCategory || undefined, searchQuery)}
            className="px-6 py-3 bg-[#1a1614] text-white rounded-2xl hover:bg-[#2a2624] transition-colors font-semibold"
          >
            Search
          </Link>
        </form>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/products"
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            !currentCategory
              ? 'bg-[#1a1614] text-white'
              : 'bg-[#faf6ef] text-[#6b5d54] hover:bg-[#f8f1e6]'
          }`}
        >
          All Categories ({categories.reduce((sum, cat) => sum + cat._count.products, 0)})
        </Link>

        {categories.map((category) => (
          <Link
            key={category.id}
            href={createHref(category.slug)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              currentCategory === category.slug
                ? 'bg-[#1a1614] text-white'
                : 'bg-[#faf6ef] text-[#6b5d54] hover:bg-[#f8f1e6]'
            }`}
          >
            {category.name} ({category._count.products})
          </Link>
        ))}
      </div>
    </div>
  );
}