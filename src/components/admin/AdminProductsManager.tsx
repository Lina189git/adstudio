"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { CANVAS_SIZE_OPTIONS, FRAME_STYLE_OPTIONS, getCanvasSizeLabel, getFrameStyleLabel } from "@/lib/paintingOrder";

type Category = { id: string; name: string; slug: string };
type Variant = { id?: string; name: string; canvasSize: string; frameStyle: string; previewImageUrl: string; details: string; priceCents: string; stockQuantity: string; isActive: boolean };
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

const newVariant = (): Variant => ({
  name: "",
  canvasSize: CANVAS_SIZE_OPTIONS[1]?.value || CANVAS_SIZE_OPTIONS[0].value,
  frameStyle: FRAME_STYLE_OPTIONS[0].value,
  previewImageUrl: "",
  details: "",
  priceCents: "0",
  stockQuantity: "0",
  isActive: true,
});

const ALL_CANVAS_SIZES = ["8x10", "12x16", "18x24", "24x36"];

const emptyFrameForm = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  availableSizes: [...ALL_CANVAS_SIZES],
  priceCents: "0",
  sortOrder: "0",
  isActive: true,
};

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
  variants: [newVariant()],
  // Commission / advertisement fields
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
  const variantFileRef = useRef<HTMLInputElement | null>(null);
  const frameFileRef = useRef<HTMLInputElement | null>(null);
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
  const [variantUploadIndex, setVariantUploadIndex] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameLoading, setFrameLoading] = useState(true);
  const [frameSaving, setFrameSaving] = useState(false);
  const [frameUploading, setFrameUploading] = useState(false);
  const [frameError, setFrameError] = useState("");
  const [frameSuccess, setFrameSuccess] = useState("");
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
  const [frameForm, setFrameForm] = useState(emptyFrameForm);

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
    } catch { /* non-critical — products still load */ }
  };
  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/products/stats");
      const data = await res.json();
      setStats({ total: data.total || 0, featured: data.featured || 0, inactive: data.inactive || 0 });
    } catch { /* non-critical — stats default to 0 */ }
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
  const resetFrameForm = () => { setEditingFrameId(null); setFrameForm(emptyFrameForm); setFrameError(""); setFrameSuccess(""); };
  const patchFrameForm = (key: string, value: unknown) => setFrameForm((current) => ({ ...current, [key]: value }));

  const editFrame = (frame: Frame) => {
    setEditingFrameId(frame.id);
    setFrameForm({
      name: frame.name,
      slug: frame.slug,
      description: frame.description || "",
      imageUrl: frame.imageUrl || "",
      availableSizes: frame.availableSizes,
      priceCents: String(frame.priceCents / 100),
      sortOrder: String(frame.sortOrder),
      isActive: frame.isActive,
    });
    setFrameError("");
    setFrameSuccess("");
  };

  const uploadFrameImage = async (file: File) => {
    setFrameUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/frames/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload frame image.");
      patchFrameForm("imageUrl", json.imageUrl);
      setFrameSuccess("Frame image uploaded.");
      setFrameError("");
    } catch (e) {
      setFrameError(e instanceof Error ? e.message : "Failed to upload frame image.");
    } finally {
      setFrameUploading(false);
    }
  };

  const saveFrame = async () => {
    setFrameSaving(true);
    try {
      const res = await fetch(
        editingFrameId ? `/api/admin/frames/${editingFrameId}` : "/api/admin/frames",
        {
          method: editingFrameId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: frameForm.name.trim(),
            slug: frameForm.slug.trim(),
            description: frameForm.description.trim() || null,
            imageUrl: frameForm.imageUrl.trim() || null,
            availableSizes: frameForm.availableSizes,
            priceCents: Math.round(Number(frameForm.priceCents) * 100),
            sortOrder: Number(frameForm.sortOrder) || 0,
            isActive: frameForm.isActive,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save frame.");
      setFrameSuccess(editingFrameId ? "Frame updated." : "Frame created.");
      resetFrameForm();
      await loadFrames();
    } catch (e) {
      setFrameError(e instanceof Error ? e.message : "Failed to save frame.");
    } finally {
      setFrameSaving(false);
    }
  };

  const removeFrame = async (frameId: string) => {
    if (!window.confirm("Delete this frame style? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/frames/${frameId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setFrameError(data.error || "Failed to delete frame.");
    setFrameSuccess("Frame deleted.");
    await loadFrames();
  };

  const toggleFrameSize = (size: string) => {
    const next = frameForm.availableSizes.includes(size)
      ? frameForm.availableSizes.filter((s) => s !== size)
      : [...frameForm.availableSizes, size];
    patchFrameForm("availableSizes", next);
  };
  const patchForm = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const patchGalleryImage = (index: number, value: string) =>
    setForm((current) => ({ ...current, galleryImages: current.galleryImages.map((image, i) => i === index ? value : image) }));
  const patchVariant = (index: number, key: keyof Variant, value: string | boolean) =>
    setForm((current) => ({ ...current, variants: current.variants.map((variant, i) => i === index ? { ...variant, [key]: value } : variant) }));

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
      variants: product.variants.length ? product.variants.map((variant) => ({ id: variant.id, name: variant.name || "", canvasSize: variant.canvasSize, frameStyle: variant.frameStyle, previewImageUrl: variant.previewImageUrl || "", details: variant.details || "", priceCents: String(variant.priceCents / 100), stockQuantity: String(variant.stockQuantity), isActive: variant.isActive })) : [newVariant()],
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

  const uploadVariantImage = async (file: File, index: number) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/products/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload frame example.");
      patchVariant(index, "previewImageUrl", json.imageUrl);
      setSuccess("Variant example image uploaded successfully.");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload frame example.");
    } finally {
      setUploading(false);
      setVariantUploadIndex(null);
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
          variants: form.variants.map((variant) => ({ id: variant.id, name: variant.name.trim() || null, canvasSize: variant.canvasSize, frameStyle: variant.frameStyle, previewImageUrl: variant.previewImageUrl.trim() || null, details: variant.details.trim() || null, priceCents: Math.round(Number(variant.priceCents) * 100), stockQuantity: Number(variant.stockQuantity), isActive: variant.isActive })),
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

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">{[{ label: "Catalog products", value: stats.total }, { label: "Featured products", value: stats.featured }, { label: "Inactive products", value: stats.inactive }].map((item) => <div key={item.label} className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8c7764]">{item.label}</p><p className="mt-3 text-3xl font-bold text-[#1a1614]">{item.value}</p></div>)}</div>
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-bold text-[#1a1614]">Product Management</h2><p className="mt-1 text-sm text-[#6b5d54]">Manage catalog records, product images, and frame/size combinations.</p></div><button type="button" onClick={() => void loadProducts(pagination.page)} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><RefreshCw className="h-4 w-4" />Refresh</button></div>
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product name or description" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#d4a574]" /><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#d4a574]"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
          {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {success ? <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
          <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[#eadfcb]">{loading ? <div className="flex items-center justify-center gap-3 px-6 py-12 text-sm text-[#6b5d54]"><Loader2 className="h-4 w-4 animate-spin" />Loading products...</div> : <div className="divide-y divide-[#eadfcb]">{products.map((product) => <div key={product.id} className="grid gap-4 px-5 py-4 md:grid-cols-[2.4fr_1fr_1fr_1fr] md:items-center"><div className="flex gap-4"><div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#eadfcb] bg-[#faf6ef]"><ProductImage src={product.imageUrl} alt={product.name} sizes="64px" /></div><div><p className="font-semibold text-[#1a1614]">{product.name}</p><p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8c7764]">/{product.slug}</p><p className="mt-2 text-sm text-[#6b5d54]">{product.shortDescription || "No short description yet."}</p></div></div><div className="text-sm text-[#1a1614]">{product.category.name}</div><div className="space-y-1 text-xs text-[#6b5d54]"><div className="font-semibold text-[#1a1614]">{money(product.basePriceCents)}</div><div>{product.variants.length} variants</div><div>{product.galleryImages?.length || 0} gallery images</div>{product.variants.slice(0, 2).map((variant) => <div key={variant.id}>{getCanvasSizeLabel(variant.canvasSize)} / {getFrameStyleLabel(variant.frameStyle)}</div>)}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => editProduct(product)} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-3 py-2 text-xs font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><Pencil className="h-3.5 w-3.5" />Edit</button><button type="button" onClick={() => void removeProduct(product.id)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Remove</button></div></div>)}</div>}</div>
          <div className="mt-5 flex items-center justify-between text-sm text-[#6b5d54]"><span>Page {pagination.page} of {Math.max(pagination.pages, 1)} | {pagination.total} products</span><div className="flex gap-2"><button type="button" disabled={pagination.page <= 1 || loading} onClick={() => void loadProducts(pagination.page - 1)} className="rounded-full border border-[#eadfcb] px-4 py-2 font-semibold text-[#1a1614] disabled:cursor-not-allowed disabled:opacity-50">Previous</button><button type="button" disabled={pagination.page >= pagination.pages || loading} onClick={() => void loadProducts(pagination.page + 1)} className="rounded-full border border-[#eadfcb] px-4 py-2 font-semibold text-[#1a1614] disabled:cursor-not-allowed disabled:opacity-50">Next</button></div></div>
        </div>
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-[#1a1614]">{editingId ? "Edit Product" : "Create Product"}</h2><p className="mt-1 text-sm text-[#6b5d54]">Upload artwork and edit frame/size combinations directly from this panel.</p></div><button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><Plus className="h-4 w-4" />New</button></div>
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2"><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: editingId || current.slug ? current.slug : slugify(event.target.value) }))} placeholder="Product name" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]" /><input value={form.slug} onChange={(event) => patchForm("slug", slugify(event.target.value))} placeholder="slug" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]" /></div>
            <div className="grid gap-4 md:grid-cols-3"><select value={form.categoryId} onChange={(event) => patchForm("categoryId", event.target.value)} className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8c7764]">$</span><input type="number" min="0" step="0.01" value={form.basePriceCents} onChange={(event) => patchForm("basePriceCents", event.target.value)} placeholder="Base price" className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] py-3 pl-7 pr-4 outline-none transition focus:border-[#d4a574]" /></div><input type="number" min="0" value={form.stockQuantity} onChange={(event) => patchForm("stockQuantity", event.target.value)} placeholder="Base stock quantity" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]" /></div>
            <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7764]">Product image</h3><p className="mt-1 text-sm text-[#6b5d54]">Upload a catalog cover image or paste a direct image URL.</p></div><button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] bg-white px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6] disabled:cursor-not-allowed disabled:opacity-70">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}Upload</button></div><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} /><div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr]"><div className="relative flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-[#eadfcb] bg-white"><ProductImage src={form.imageUrl} alt="Product preview" sizes="128px" /></div><input value={form.imageUrl} onChange={(event) => patchForm("imageUrl", event.target.value)} placeholder="Cover image URL" className="rounded-xl border border-[#eadfcb] bg-white px-4 py-3 outline-none transition focus:border-[#d4a574]" /></div></div>
            <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7764]">Product gallery</h3><p className="mt-1 text-sm text-[#6b5d54]">Upload more artwork views for the individual product page gallery.</p></div><button type="button" onClick={() => galleryFileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] bg-white px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6] disabled:cursor-not-allowed disabled:opacity-70">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}Add image</button></div><input ref={galleryFileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadGalleryImage(file); event.currentTarget.value = ""; }} /><div className="mt-4 space-y-3">{form.galleryImages.length ? <div className="grid gap-3 sm:grid-cols-2">{form.galleryImages.map((image, index) => <div key={`${image}-${index}`} className="rounded-2xl border border-[#eadfcb] bg-white p-3"><div className="relative h-32 overflow-hidden rounded-2xl border border-[#eadfcb] bg-[#faf6ef]"><ProductImage src={image} alt={`Gallery ${index + 1}`} sizes="240px" /></div><div className="mt-3 flex gap-2"><input value={image} onChange={(event) => patchGalleryImage(index, event.target.value)} placeholder="Gallery image URL" className="min-w-0 flex-1 rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm outline-none transition focus:border-[#d4a574]" /><button type="button" onClick={() => patchForm("galleryImages", form.galleryImages.filter((_, i) => i !== index))} className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 text-red-700 transition hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div>)}</div> : <div className="rounded-2xl border border-dashed border-[#d9ccb9] bg-white px-4 py-6 text-sm text-[#6b5d54]">No gallery images yet. Upload detail shots, room views, or close-ups for the product page.</div>}</div></div>
            <input value={form.shortDescription} onChange={(event) => patchForm("shortDescription", event.target.value)} placeholder="Short description" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]" />
            <textarea rows={4} value={form.description} onChange={(event) => patchForm("description", event.target.value)} placeholder="Full description" className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]" />
            <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7764]">Size and frame variants</h3><p className="mt-1 text-sm text-[#6b5d54]">Edit the frame, floating selector labels, and example image for each option.</p></div><button type="button" onClick={() => patchForm("variants", [...form.variants, newVariant()])} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] bg-white px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><Plus className="h-4 w-4" />Add variant</button></div><input ref={variantFileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file && variantUploadIndex !== null) void uploadVariantImage(file, variantUploadIndex); event.currentTarget.value = ""; }} /><div className="mt-4 space-y-3">{form.variants.map((variant, index) => <div key={variant.id || `${variant.canvasSize}-${variant.frameStyle}-${index}`} className="rounded-2xl border border-[#eadfcb] bg-white p-4 space-y-3">
                        {/* Header: variant number + delete */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center rounded-full bg-[#f8f1e6] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8c7764]">Variant {index + 1}</span>
                          <button type="button" onClick={() => patchForm("variants", form.variants.length === 1 ? [newVariant()] : form.variants.filter((_, i) => i !== index))} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Remove</button>
                        </div>
                        {/* Variant label / display name */}
                        <div>
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Display name</p>
                          <input value={variant.name} onChange={(event) => patchVariant(index, "name", event.target.value)} placeholder={`Auto: ${getCanvasSizeLabel(variant.canvasSize)} / ${getFrameStyleLabel(variant.frameStyle)}`} className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none transition focus:border-[#d4a574]" />
                        </div>
                        {/* Canvas size + frame style */}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Canvas size</p>
                            <select value={variant.canvasSize} onChange={(event) => patchVariant(index, "canvasSize", event.target.value)} className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none transition focus:border-[#d4a574]">{CANVAS_SIZE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                          </div>
                          {(() => {
                            const knownFrameValues = new Set([...FRAME_STYLE_OPTIONS.map((o) => o.value), ...frames.map((f) => f.slug)]);
                            const isCustomFrame = !knownFrameValues.has(variant.frameStyle);
                            return (
                              <div>
                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Frame style</p>
                                <div className="space-y-2">
                                  <select
                                    value={isCustomFrame ? "__custom__" : variant.frameStyle}
                                    onChange={(e) => {
                                      if (e.target.value === "__custom__") patchVariant(index, "frameStyle", "");
                                      else patchVariant(index, "frameStyle", e.target.value);
                                    }}
                                    className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none transition focus:border-[#d4a574]"
                                  >
                                    <optgroup label="Standard">
                                      {FRAME_STYLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </optgroup>
                                    {frames.length > 0 && (
                                      <optgroup label="Custom frames">
                                        {frames.map((f) => <option key={f.id} value={f.slug}>{f.name}</option>)}
                                      </optgroup>
                                    )}
                                    <option value="__custom__">+ Custom name...</option>
                                  </select>
                                  {isCustomFrame && (
                                    <input
                                      value={variant.frameStyle}
                                      onChange={(e) => patchVariant(index, "frameStyle", e.target.value)}
                                      placeholder="Enter custom frame style name"
                                      className="w-full rounded-xl border border-[#d4a574] bg-white px-4 py-2.5 text-sm text-[#1a1614] outline-none transition placeholder:text-[#a89a8e]"
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        {/* Add-on price + stock qty */}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Add-on price</p>
                            <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8c7764]">$</span><input type="number" min="0" step="0.01" value={variant.priceCents} onChange={(event) => patchVariant(index, "priceCents", event.target.value)} placeholder="0.00" className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] py-2.5 pl-7 pr-4 text-sm outline-none transition focus:border-[#d4a574]" /></div>
                          </div>
                          <div>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Stock qty <span className="normal-case font-normal text-[#a89a8e]">(internal only)</span></p>
                            <input type="number" min="0" value={variant.stockQuantity} onChange={(event) => patchVariant(index, "stockQuantity", event.target.value)} placeholder="0" className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none transition focus:border-[#d4a574]" />
                          </div>
                        </div>
                        {/* Preview image + details */}
                        <div>
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Frame example image</p>
                          <div className="grid gap-3 md:grid-cols-[88px_1fr]">
                            <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-2xl border border-[#eadfcb] bg-[#faf6ef]"><ProductImage src={variant.previewImageUrl} alt="Variant preview" sizes="88px" /></div>
                            <div className="space-y-2">
                              <div className="flex gap-2"><button type="button" onClick={() => { setVariantUploadIndex(index); variantFileRef.current?.click(); }} disabled={uploading} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#eadfcb] bg-[#faf6ef] px-3 py-2 text-xs font-semibold text-[#1a1614] transition hover:bg-[#f0e8d8]"><UploadCloud className="h-3.5 w-3.5" />Upload</button><input value={variant.previewImageUrl} onChange={(event) => patchVariant(index, "previewImageUrl", event.target.value)} placeholder="or paste image URL" className="min-w-0 flex-1 rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-3 py-2 text-xs outline-none transition focus:border-[#d4a574]" /></div>
                              <textarea rows={2} value={variant.details} onChange={(event) => patchVariant(index, "details", event.target.value)} placeholder="Short note shown to customers, e.g. Warm walnut border." className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none transition focus:border-[#d4a574]" />
                            </div>
                          </div>
                        </div>
                        {/* Active toggle */}
                        <div className="flex justify-end">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#eadfcb] bg-[#faf6ef] px-4 py-2 text-xs font-semibold text-[#1a1614]"><input type="checkbox" checked={variant.isActive} onChange={(event) => patchVariant(index, "isActive", event.target.checked)} />Active on storefront</label>
                        </div>
                      </div>)}</div></div>
            <div className="grid gap-3 md:grid-cols-2"><label className="flex items-center gap-3 rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm font-medium text-[#1a1614]"><input type="checkbox" checked={form.isFeatured} onChange={(event) => patchForm("isFeatured", event.target.checked)} />Featured product</label><label className="flex items-center gap-3 rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm font-medium text-[#1a1614]"><input type="checkbox" checked={form.isActive} onChange={(event) => patchForm("isActive", event.target.checked)} />Visible in storefront</label></div>
            {/* Advertisement settings */}
            <div className="rounded-[1.5rem] border border-[#eadfcb] bg-[#faf6ef] p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Advertisement settings</p>
              {/* Commission type */}
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
              {/* Commission value */}
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
              {/* Sample stock */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Sample stock <span className="normal-case font-normal text-[#a89a8e]">(units available to ship to influencers)</span></p>
                <input type="number" min="0" value={form.sampleStock} onChange={(e) => patchForm("sampleStock", e.target.value)} placeholder="0" className="w-full rounded-xl border border-[#eadfcb] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#d4a574]" />
              </div>
              {/* Task requirements */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Task requirements <span className="normal-case font-normal text-[#a89a8e]">(shown to influencer applicants)</span></p>
                <textarea rows={4} value={form.taskRequirements} onChange={(e) => patchForm("taskRequirements", e.target.value)} placeholder="e.g. Must show product unboxing, 60-second min runtime, include brand handle @..." className="w-full rounded-xl border border-[#eadfcb] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#d4a574]" />
              </div>
            </div>
            <button type="button" disabled={saving || uploading} onClick={() => void saveProduct()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:cursor-not-allowed disabled:opacity-70">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editingId ? "Save product updates" : "Create product"}</button>
          </div>
        </div>
      </div>
      {/* ── Frame Styles Manager ─────────────────────────────────── */}
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Frame list */}
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1a1614]">Frame Styles</h2>
              <p className="mt-1 text-sm text-[#6b5d54]">Manage frame options that appear in the product configurator and storefront.</p>
            </div>
            <button type="button" onClick={() => void loadFrames()} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><RefreshCw className="h-4 w-4" />Refresh</button>
          </div>
          {frameError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{frameError}</div> : null}
          {frameSuccess ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{frameSuccess}</div> : null}
          <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[#eadfcb]">
            {frameLoading ? (
              <div className="flex items-center justify-center gap-3 px-6 py-12 text-sm text-[#6b5d54]"><Loader2 className="h-4 w-4 animate-spin" />Loading frame styles...</div>
            ) : frames.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-[#6b5d54]">No frame styles yet. Create the first one using the form.</div>
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
                    <div className="flex shrink-0 flex-col gap-2">
                      <button type="button" onClick={() => editFrame(frame)} className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfcb] px-3 py-2 text-xs font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><Pencil className="h-3.5 w-3.5" />Edit</button>
                      <button type="button" onClick={() => void removeFrame(frame.id)} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Frame add / edit form */}
        <div className="rounded-[1.75rem] border border-[#eadfcb] bg-white p-6 shadow-[0_10px_35px_rgba(26,22,20,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#1a1614]">{editingFrameId ? "Edit Frame Style" : "Add Frame Style"}</h2>
              <p className="mt-1 text-sm text-[#6b5d54]">Upload a preview photo and set pricing for this frame option.</p>
            </div>
            <button type="button" onClick={resetFrameForm} className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"><Plus className="h-4 w-4" />New</button>
          </div>

          <div className="mt-6 space-y-4">
            {/* Name + slug */}
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={frameForm.name}
                onChange={(e) => setFrameForm((c) => ({ ...c, name: e.target.value, slug: editingFrameId || c.slug ? c.slug : slugify(e.target.value) }))}
                placeholder="Frame name (e.g. White Oak)"
                className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"
              />
              <input
                value={frameForm.slug}
                onChange={(e) => patchFrameForm("slug", slugify(e.target.value))}
                placeholder="slug (e.g. white_oak)"
                className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"
              />
            </div>

            {/* Description */}
            <input
              value={frameForm.description}
              onChange={(e) => patchFrameForm("description", e.target.value)}
              placeholder="Short description shown to customers (optional)"
              className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"
            />

            {/* Frame image */}
            <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7764]">Frame picture</h3>
                  <p className="mt-1 text-sm text-[#6b5d54]">Upload or paste a URL for the frame preview photo.</p>
                </div>
                <button
                  type="button"
                  onClick={() => frameFileRef.current?.click()}
                  disabled={frameUploading}
                  className="inline-flex items-center gap-2 rounded-full border border-[#eadfcb] bg-white px-4 py-2 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6] disabled:opacity-70"
                >
                  {frameUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  Upload
                </button>
              </div>
              <input
                ref={frameFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadFrameImage(file); e.currentTarget.value = ""; }}
              />
              <div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr]">
                <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-[#eadfcb] bg-white">
                  <ProductImage src={frameForm.imageUrl} alt="Frame preview" sizes="128px" />
                </div>
                <input
                  value={frameForm.imageUrl}
                  onChange={(e) => patchFrameForm("imageUrl", e.target.value)}
                  placeholder="Frame image URL"
                  className="rounded-xl border border-[#eadfcb] bg-white px-4 py-3 outline-none transition focus:border-[#d4a574]"
                />
              </div>
            </div>

            {/* Price + sort order */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Add-on price</p>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8c7764]">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={frameForm.priceCents}
                    onChange={(e) => patchFrameForm("priceCents", e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] py-3 pl-7 pr-4 outline-none transition focus:border-[#d4a574]"
                  />
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7764]">Sort order</p>
                <input
                  type="number" min="0"
                  value={frameForm.sortOrder}
                  onChange={(e) => patchFrameForm("sortOrder", e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 outline-none transition focus:border-[#d4a574]"
                />
              </div>
            </div>

            {/* Available sizes */}
            <div className="rounded-[1.25rem] border border-[#eadfcb] bg-[#faf6ef] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7764]">Available canvas sizes</h3>
              <p className="mt-1 text-sm text-[#6b5d54]">Select which canvas sizes this frame can be ordered with.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ALL_CANVAS_SIZES.map((size) => {
                  const active = frameForm.availableSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleFrameSize(size)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-[#1a1614] bg-[#1a1614] text-white" : "border-[#eadfcb] bg-white text-[#6b5d54] hover:bg-[#f8f1e6]"}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm font-medium text-[#1a1614]">
              <input type="checkbox" checked={frameForm.isActive} onChange={(e) => patchFrameForm("isActive", e.target.checked)} />
              Visible in storefront
            </label>

            <button
              type="button"
              disabled={frameSaving || frameUploading}
              onClick={() => void saveFrame()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1614] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {frameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingFrameId ? "Save frame updates" : "Create frame style"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
