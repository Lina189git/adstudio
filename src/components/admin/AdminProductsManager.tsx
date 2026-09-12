"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { getCanvasSizeLabel, getFrameStyleLabel } from "@/lib/paintingOrder";

type Category = { id: string; name: string; slug: string };
type Frame = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  availableSizes: string[];
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
};
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  basePriceCents: number;
  imageUrl: string | null;
  galleryImages?: string[];
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  category: Category;
  variants: Array<{ id: string; name?: string | null; canvasSize: string; frameStyle: string; previewImageUrl: string | null; details: string | null; priceCents: number; stockQuantity: number; isActive: boolean }>;
};
type Stats = { total: number; featured: number; inactive: number };
type Pagination = { page: number; pages: number; total: number };

const emptyForm = {
  name: "",
  slug: "",
  categoryId: "",
  basePriceCents: "0",
  stockQuantity: "0",
  imageUrl: "",
  galleryImages: [] as string[],
  shortDescription: "",
  description: "",
  isFeatured: false,
  isActive: true,
  commissionType: "PERCENTAGE",
  commissionRate: "10",
  commissionFixed: "0",
  sampleStock: "0",
  taskRequirements: "",
};

function ProductImage({ src, alt, sizes }: { src: string | null | undefined; alt: string; sizes: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="flex h-full items-center justify-center text-[#8c7764]"><ImagePlus className="h-5 w-5" /></div>;
  return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" onError={() => setFailed(true)} />;
}

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export default function AdminProductsManager() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const galleryFileRef = useRef<HTMLInputElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, featured: 0, inactive: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameLoading, setFrameLoading] = useState(true);
  const [frameError, setFrameError] = useState("");
  const [frameSuccess, setFrameSuccess] = useState("");

  const loadFrames = async () => {
    setFrameLoading(true);
    try {
      const res = await fetch("/api/admin/frames?includeInactive=true");
      const data = await res.json();
      setFrames(data.frames || []);
    } finally {
      setFrameLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch { /* non-critical */ }
  };
  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/products/stats");
      const data = await res.json();
      setStats({ total: data.total || 0, featured: data.featured || 0, inactive: data.inactive || 0 });
    } catch { /* non-critical */ }
  };
  const loadProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: "12" });
      if (search.trim()) query.set("search", search.trim());
      if (categoryFilter) query.set("category", categoryFilter);
      const res = await fetch(`/api/admin/products?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch products.");
      setProducts(data.products);
      setPagination(data.pagination);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => { void Promise.all([loadCategories(), loadStats(), loadProducts(1), loadFrames()]); }, [loadProducts]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadProducts(1); }, 250);
    return () => window.clearTimeout(timer);
  }, [categoryFilter, loadProducts, search]);

  const resetForm = () => { setEditingId(null); setForm(emptyForm); setError(""); setSuccess(""); };
  const patchForm = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const patchGalleryImage = (index: number, value: string) =>
    setForm((current) => ({ ...current, galleryImages: current.galleryImages.map((image, i) => i === index ? value : image) }));

  const editProduct = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      categoryId: product.category.id,
      basePriceCents: String(product.basePriceCents / 100),
      stockQuantity: String(product.stockQuantity),
      imageUrl: product.imageUrl || "",
      galleryImages: product.galleryImages || [],
      shortDescription: product.shortDescription || "",
      description: product.description || "",
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      commissionType: (product as { commissionType?: string }).commissionType || "PERCENTAGE",
      commissionRate: String(((product as { commissionRate?: number }).commissionRate || 0.10) * 100),
      commissionFixed: String(((product as { commissionFixed?: number }).commissionFixed || 0) / 100),
      sampleStock: String((product as { sampleStock?: number }).sampleStock || 0),
      taskRequirements: (product as { taskRequirements?: string | null }).taskRequirements || "",
    });
    setError("");
    setSuccess("");
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/products/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload image.");
      patchForm("imageUrl", json.imageUrl);
      setSuccess("Product image uploaded successfully.");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const uploadGalleryImage = async (file: File) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/products/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload gallery image.");
      setForm((current) => ({ ...current, galleryImages: [...current.galleryImages, json.imageUrl] }));
      setSuccess("Gallery image uploaded successfully.");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload gallery image.");
    } finally {
      setUploading(false);
    }
  };

  const saveProduct = async () => {
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/admin/products/${editingId}` : "/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          categoryId: form.categoryId,
          basePriceCents: Math.round(Number(form.basePriceCents) * 100),
          stockQuantity: Number(form.stockQuantity),
          imageUrl: form.imageUrl.trim() || null,
          galleryImages: form.galleryImages.map((image) => image.trim()).filter(Boolean),
          shortDescription: form.shortDescription.trim() || null,
          description: form.description.trim() || null,
          isFeatured: form.isFeatured,
          isActive: form.isActive,
          commissionType: form.commissionType,
          commissionRate: form.commissionType === "PERCENTAGE" ? Number(form.commissionRate) / 100 : 0,
          commissionFixed: form.commissionType === "FIXED" ? Math.round(Number(form.commissionFixed) * 100) : 0,
          sampleStock: Number(form.sampleStock),
          taskRequirements: form.taskRequirements.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product.");
      setSuccess(editingId ? "Product updated successfully." : "Product created successfully.");
      resetForm();
      await Promise.all([loadProducts(editingId ? pagination.page : 1), loadStats()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (productId: string) => {
    if (!window.confirm("Delete this product? Existing orders will keep a deactivated product.")) return;
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed to delete product.");
    setSuccess(data.message || "Product removed.");
    await Promise.all([loadProducts(pagination.page), loadStats()]);
  };

  const removeFrame = async (frameId: string) => {
    if (!window.confirm("Delete this frame style? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/frames/${frameId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setFrameError(data.error || "Failed to delete frame.");
    setFrameSuccess("Frame deleted.");
    await loadFrames();
  };

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Catalog products", value: stats.total },
          { label: "Featured products", value: stats.featured },
          { label: "Inactive products", value: stats.inactive },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8c7764]">{item.label}</p>
            <p className="mt-3 text-3xl font-bold text-[#1a1614]">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Product list + Create/Edit form */}
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Product list */}
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1a1614]">Product Management</h2>
              <p className="mt-1 text-sm text-[#6b5d54]">Manage catalog records and product images.</p>
            </div>
            <button type="button" onClick={() => void loadProducts(pagination.page)} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><RefreshCw className="h-4 w-4" />Refresh</button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product name or description" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#d4a574]" />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#d4a574]">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {success ? <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
          <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[#eadfcb]">
            {loading ? (
              <div className="flex items-center justify-center gap-3 px-6 py-12 text-sm text-[#6b5d54]"><Loader2 className="h-4 w-4 animate-spin" />Loading products...</div>
            ) : (
              <div className="divide-y divide-[#eadfcb]">
                {products.map((product) => (
                  <div key={product.id} className="grid gap-4 px-5 py-4 md:grid-cols-[2.4fr_1fr_1fr_1fr] md:items-center">
                    <div className="flex gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#eadfcb] bg-[#faf6ef]">
                        <ProductImage src={product.imageUrl} alt={product.name} sizes="64px" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1614]">{product.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8c7764]">/{product.slug}</p>
                        <p className="mt-2 text-sm text-[#6b5d54]">{product.shortDescription || "No short description yet."}</p>
                      </div>
                    </div>
                    <div className="text-sm text-[#1a1614]">{product.category.name}</div>
                    <div className="space-y-1 text-xs text-[#6b5d54]">
                      <div className="font-semibold text-[#1a1614]">{money(product.basePriceCents)}</div>
                      <div>{product.variants.length} variants</div>
                      <div>{product.galleryImages?.length || 0} gallery images</div>
                      {product.variants.slice(0, 2).map((variant) => (
                        <div key={variant.id}>{getCanvasSizeLabel(variant.canvasSize)} / {getFrameStyleLabel(variant.frameStyle)}</div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => editProduct(product)} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-3 py-2 text-xs font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><Pencil className="h-3.5 w-3.5" />Edit</button>
                      <button type="button" onClick={() => void removeProduct(product.id)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between text-sm text-[#6b5d54]">
            <span>Page {pagination.page} of {Math.max(pagination.pages, 1)} | {pagination.total} products</span>
            <div className="flex gap-2">
              <button type="button" disabled={pagination.page <= 1 || loading} onClick={() => void loadProducts(pagination.page - 1)} className="rounded-full border border-[#eadfcb] px-4 py-2 font-semibold text-[#1a1614] disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
              <button type="button" disabled={pagination.page >= pagination.pages || loading} onClick={() => void loadProducts(pagination.page + 1)} className="rounded-full border border-[#eadfcb] px-4 py-2 font-semibold text-[#1a1614] disabled:cursor-not-allowed disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>

        {/* Create / Edit form */}
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#1a1614]">{editingId ? "Edit Product" : "Create Product"}</h2>
              <p className="mt-1 text-sm text-[#6b5d54]">Upload artwork and configure product details.</p>
            </div>
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><Plus className="h-4 w-4" />New</button>
          </div>
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: editingId || current.slug ? current.slug : slugify(event.target.value) }))} placeholder="Product name" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]" />
              <input value={form.slug} onChange={(event) => patchForm("slug", slugify(event.target.value))} placeholder="slug" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <select value={form.categoryId} onChange={(event) => patchForm("categoryId", event.target.value)} className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]">
                <option value="">Select category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8c7764]">$</span>
                <input type="number" min="0" step="0.01" value={form.basePriceCents} onChange={(event) => patchForm("basePriceCents", event.target.value)} placeholder="Base price" className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] py-3 pl-7 pr-4 outline-none transition focus:border-[#d4a574]" />
              </div>
              <input type="number" min="0" value={form.stockQuantity} onChange={(event) => patchForm("stockQuantity", event.target.value)} placeholder="Stock quantity" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]" />
            </div>

            {/* Product image */}
            <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7764]">Product image</h3>
                  <p className="mt-1 text-sm text-[#6b5d54]">Upload a catalog cover image or paste a direct image URL.</p>
                </div>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] bg-white px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6] disabled:opacity-70">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}Upload
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} />
              <div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr]">
                <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-[#eadfcb] bg-white">
                  <ProductImage src={form.imageUrl} alt="Product preview" sizes="128px" />
                </div>
                <input value={form.imageUrl} onChange={(event) => patchForm("imageUrl", event.target.value)} placeholder="Cover image URL" className="rounded-xl border border-[#eadfcb] bg-white px-4 py-3 outline-none transition focus:border-[#d4a574]" />
              </div>
            </div>

            {/* Product gallery */}
            <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7764]">Product gallery</h3>
                  <p className="mt-1 text-sm text-[#6b5d54]">Upload more artwork views for the individual product page gallery.</p>
                </div>
                <button type="button" onClick={() => galleryFileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] bg-white px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6] disabled:opacity-70">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}Add image
                </button>
              </div>
              <input ref={galleryFileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadGalleryImage(file); event.currentTarget.value = ""; }} />
              <div className="mt-4 space-y-3">
                {form.galleryImages.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {form.galleryImages.map((image, index) => (
                      <div key={`${image}-${index}`} className="rounded-2xl border border-[#eadfcb] bg-white p-3">
                        <div className="relative h-32 overflow-hidden rounded-2xl border border-[#eadfcb] bg-[#faf6ef]">
                          <ProductImage src={image} alt={`Gallery ${index + 1}`} sizes="240px" />
                        </div>
                        <div className="mt-3 flex gap-2">
                          <input value={image} onChange={(event) => patchGalleryImage(index, event.target.value)} placeholder="Gallery image URL" className="min-w-0 flex-1 rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm outline-none transition focus:border-[#d4a574]" />
                          <button type="button" onClick={() => patchForm("galleryImages", form.galleryImages.filter((_, i) => i !== index))} className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 text-red-700 transition hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#d9ccb9] bg-white px-4 py-6 text-sm text-[#6b5d54]">No gallery images yet. Upload detail shots, room views, or close-ups for the product page.</div>
                )}
              </div>
            </div>

            <input value={form.shortDescription} onChange={(event) => patchForm("shortDescription", event.target.value)} placeholder="Short description" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]" />
            <textarea rows={4} value={form.description} onChange={(event) => patchForm("description", event.target.value)} placeholder="Full description" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]" />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm font-medium text-[#1a1614]"><input type="checkbox" checked={form.isFeatured} onChange={(event) => patchForm("isFeatured", event.target.checked)} />Featured product</label>
              <label className="flex items-center gap-3 rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm font-medium text-[#1a1614]"><input type="checkbox" checked={form.isActive} onChange={(event) => patchForm("isActive", event.target.checked)} />Visible in storefront</label>
            </div>

            {/* Advertisement settings */}
            <div className="rounded-[1.5rem] border border-[#eadfcb] bg-[#faf6ef] p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Advertisement settings</p>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Commission type</p>
                <div className="flex gap-3">
                  <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${form.commissionType === "PERCENTAGE" ? "border-[#d4a574] bg-white text-[#1a1614]" : "border-[#eadfcb] bg-white text-[#6b5d54] hover:border-[#d4a574]"}`}>
                    <input type="radio" name="commissionType" value="PERCENTAGE" checked={form.commissionType === "PERCENTAGE"} onChange={() => patchForm("commissionType", "PERCENTAGE")} className="sr-only" />
                    % of sale
                  </label>
                  <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${form.commissionType === "FIXED" ? "border-[#d4a574] bg-white text-[#1a1614]" : "border-[#eadfcb] bg-white text-[#6b5d54] hover:border-[#d4a574]"}`}>
                    <input type="radio" name="commissionType" value="FIXED" checked={form.commissionType === "FIXED"} onChange={() => patchForm("commissionType", "FIXED")} className="sr-only" />
                    Fixed amount
                  </label>
                </div>
              </div>
              {form.commissionType === "PERCENTAGE" ? (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Commission rate (%)</p>
                  <div className="relative">
                    <input type="number" min="0" max="100" step="0.1" value={form.commissionRate} onChange={(e) => patchForm("commissionRate", e.target.value)} placeholder="10" className="w-full rounded-xl border border-[#eadfcb] bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition focus:border-[#d4a574]" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8c7764]">%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Fixed commission amount</p>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8c7764]">$</span>
                    <input type="number" min="0" step="0.01" value={form.commissionFixed} onChange={(e) => patchForm("commissionFixed", e.target.value)} placeholder="0.00" className="w-full rounded-xl border border-[#eadfcb] bg-white py-2.5 pl-7 pr-4 text-sm outline-none transition focus:border-[#d4a574]" />
                  </div>
                </div>
              )}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Sample stock <span className="normal-case font-normal text-[#a89a8e]">(units available to ship to influencers)</span></p>
                <input type="number" min="0" value={form.sampleStock} onChange={(e) => patchForm("sampleStock", e.target.value)} placeholder="0" className="w-full rounded-xl border border-[#eadfcb] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#d4a574]" />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Task requirements <span className="normal-case font-normal text-[#a89a8e]">(shown to influencer applicants)</span></p>
                <textarea rows={4} value={form.taskRequirements} onChange={(e) => patchForm("taskRequirements", e.target.value)} placeholder="e.g. Must show product unboxing, 60-second min runtime, include brand handle @..." className="w-full rounded-xl border border-[#eadfcb] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#d4a574]" />
              </div>
            </div>

            <button type="button" disabled={saving || uploading} onClick={() => void saveProduct()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:opacity-70">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Save product updates" : "Create product"}
            </button>
          </div>
        </div>
      </div>

      {/* Frame Styles — read-only list */}
      <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1a1614]">Frame Styles</h2>
            <p className="mt-1 text-sm text-[#6b5d54]">Frame options available in the product configurator and storefront.</p>
          </div>
          <button type="button" onClick={() => void loadFrames()} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><RefreshCw className="h-4 w-4" />Refresh</button>
        </div>
        {frameError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{frameError}</div> : null}
        {frameSuccess ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{frameSuccess}</div> : null}
        <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[#eadfcb]">
          {frameLoading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-12 text-sm text-[#6b5d54]"><Loader2 className="h-4 w-4 animate-spin" />Loading frame styles...</div>
          ) : frames.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[#6b5d54]">No frame styles yet.</div>
          ) : (
            <div className="divide-y divide-[#eadfcb]">
              {frames.map((frame) => (
                <div key={frame.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#eadfcb] bg-[#faf6ef]">
                    <ProductImage src={frame.imageUrl} alt={frame.name} sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1a1614]">{frame.name}</p>
                      {!frame.isActive && <span className="rounded-full bg-[#f8f1e6] px-2 py-0.5 text-xs font-semibold text-[#8c7764]">Inactive</span>}
                    </div>
                    <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-[#8c7764]">{frame.slug}</p>
                    {frame.description ? <p className="mt-1 text-sm text-[#6b5d54] line-clamp-1">{frame.description}</p> : null}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {frame.availableSizes.map((size) => (
                        <span key={size} className="rounded-full border border-[#eadfcb] bg-[#faf6ef] px-2 py-0.5 text-xs text-[#6b5d54]">{size}</span>
                      ))}
                      <span className="rounded-full border border-[#eadfcb] bg-[#faf6ef] px-2 py-0.5 text-xs font-medium text-[#1a1614]">{money(frame.priceCents)} add-on</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => void removeFrame(frame.id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
