"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";

type Profile = {
  bio: string | null; website: string | null; instagram: string | null; youtube: string | null;
  tiktok: string | null; twitter: string | null; followerCount: number | null; niche: string[];
  country: string | null; city: string | null; shippingAddress: Record<string, string> | null;
};

const ALL_NICHES = ["Fashion", "Beauty", "Tech", "Gaming", "Food", "Travel", "Fitness", "Home", "Parenting", "Finance", "Education", "Art", "Music", "Sports"];

const emptyProfile = {
  bio: "", website: "", instagram: "", youtube: "", tiktok: "", twitter: "",
  followerCount: "", niche: [] as string[], country: "", city: "",
  shippingAddress: { name: "", address1: "", address2: "", city: "", state: "", zip: "", country: "" },
};

export default function ProfileSetup() {
  const [form, setForm] = useState(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/influencer/profile")
      .then((r) => r.json())
      .then(({ profile }: { profile: Profile | null }) => {
        if (profile) {
          setForm({
            bio: profile.bio || "",
            website: profile.website || "",
            instagram: profile.instagram || "",
            youtube: profile.youtube || "",
            tiktok: profile.tiktok || "",
            twitter: profile.twitter || "",
            followerCount: String(profile.followerCount || ""),
            niche: profile.niche || [],
            country: profile.country || "",
            city: profile.city || "",
            shippingAddress: (profile.shippingAddress as typeof emptyProfile.shippingAddress) || emptyProfile.shippingAddress,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleNiche = (n: string) =>
    setForm((f) => ({ ...f, niche: f.niche.includes(n) ? f.niche.filter((x) => x !== n) : [...f.niche, n] }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/influencer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, followerCount: form.followerCount ? Number(form.followerCount) : null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed.");
      setSuccess("Profile saved successfully.");
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save."); }
    finally { setSaving(false); }
  };

  const patchAddress = (key: string, value: string) =>
    setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, [key]: value } }));

  if (loading) return <div className="flex items-center justify-center py-12 text-sm text-[#6b5d54]"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading profile...</div>;

  const addr = form.shippingAddress || emptyProfile.shippingAddress;

  return (
    <div className="space-y-8">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {/* Bio & social */}
      <div className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-6 space-y-4">
        <h3 className="text-base font-bold text-[#1a1614]">Your influencer profile</h3>
        <textarea rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Short bio — tell brands about your audience and content style" className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm outline-none focus:border-[#d4a574]" />
        <div className="grid gap-4 md:grid-cols-2">
          {(["website", "instagram", "youtube", "tiktok", "twitter"] as const).map((field) => (
            <div key={field}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8c7764]">{field.charAt(0).toUpperCase() + field.slice(1)}</p>
              <input value={(form as unknown as Record<string, string>)[field] || ""} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} placeholder={field === "website" ? "https://yoursite.com" : `@${field}handle`} className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]" />
            </div>
          ))}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8c7764]">Total followers</p>
            <input type="number" min="0" value={form.followerCount} onChange={(e) => setForm((f) => ({ ...f, followerCount: e.target.value }))} placeholder="e.g. 50000" className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8c7764]">Country</p><input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="United States" className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]" /></div>
          <div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8c7764]">City</p><input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="New York" className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]" /></div>
        </div>
      </div>

      {/* Niche */}
      <div className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-6">
        <h3 className="mb-4 text-base font-bold text-[#1a1614]">Content niches</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_NICHES.map((n) => (
            <button key={n} type="button" onClick={() => toggleNiche(n)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${form.niche.includes(n) ? "border-[#1a1614] bg-[#1a1614] text-white" : "border-[#eadfcb] bg-[#faf6ef] text-[#6b5d54] hover:bg-[#f0e8d8]"}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Shipping address */}
      <div className="rounded-[1.5rem] border border-[#eadfcb] bg-white p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#1a1614]">Product sample address</h3>
          <p className="mt-1 text-sm text-[#6b5d54]">Where should brands ship your product samples?</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { key: "name", label: "Full name", placeholder: "Jane Doe" },
            { key: "address1", label: "Address line 1", placeholder: "123 Main St" },
            { key: "address2", label: "Address line 2", placeholder: "Apt 4B (optional)" },
            { key: "city", label: "City", placeholder: "Los Angeles" },
            { key: "state", label: "State / Province", placeholder: "CA" },
            { key: "zip", label: "ZIP / Postal code", placeholder: "90001" },
            { key: "country", label: "Country", placeholder: "US" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8c7764]">{label}</p>
              <input value={(addr as Record<string, string>)[key] || ""} onChange={(e) => patchAddress(key, e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-2.5 text-sm outline-none focus:border-[#d4a574]" />
            </div>
          ))}
        </div>
      </div>

      <button disabled={saving} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1614] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:opacity-70">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save profile
      </button>
    </div>
  );
}
