"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  ClipboardCopy,
  CreditCard,
  Loader2,
  Lock,
  Shield,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { getTaxRate, formatTaxRate, US_STATES } from "@/lib/taxRates";

export interface CartItemData {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    basePriceCents: number;
    imageUrl: string | null;
  };
  variant: {
    id: string;
    name: string;
    priceCents: number;
    canvasSize?: string | null;
    frameStyle?: string | null;
  } | null;
}

interface Props {
  cartItems: CartItemData[];
  userEmail: string;
  userName: string;
}

const INPUT =
  "w-full rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3 text-sm text-[#1a1614] outline-none transition focus:border-[#d4a574]";
const LABEL = "block text-sm font-medium text-[#1a1614] mb-1.5";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=100";

export default function CheckoutClient({ cartItems, userEmail, userName }: Props) {
  const router = useRouter();

  // Shipping form state
  const [firstName, setFirstName] = useState(userName.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(userName.split(" ").slice(1).join(" ") ?? "");
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("US");

  // Order state
  const [placing, setPlacing] = useState(false);
  const [formError, setFormError] = useState("");
  const [placed, setPlaced] = useState<{ orderId: string; reference: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Price calculations
  const lineItems = useMemo(
    () =>
      cartItems.map((item) => {
        const unitCents = item.product.basePriceCents + (item.variant?.priceCents ?? 0);
        return { ...item, unitCents, totalCents: unitCents * item.quantity };
      }),
    [cartItems]
  );

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.totalCents, 0),
    [lineItems]
  );

  const shipping = subtotal >= 5000 ? 0 : 995;

  const taxRate = useMemo(() => getTaxRate(country, state), [country, state]);
  const tax = useMemo(() => Math.round(subtotal * taxRate), [subtotal, taxRate]);
  const total = subtotal + shipping + tax;

  const taxLabel = useMemo(() => {
    const isUS = country === "US" || country.toLowerCase().includes("united states");
    if (!isUS) return "VAT (handled at destination)";
    if (!state) return "Select a state to calculate tax";
    return `Tax — ${formatTaxRate(taxRate)}`;
  }, [country, state, taxRate]);

  const handleCopy = async () => {
    if (!placed) return;
    await navigator.clipboard.writeText(placed.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!firstName || !lastName || !address || !city || !zip || !country) {
      setFormError("Please fill in all required shipping fields.");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          state,
          zip,
          country,
          subtotalCents: subtotal,
          shippingCents: shipping,
          taxCents: tax,
          totalCents: total,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order.");

      setPlaced({ orderId: data.orderId, reference: data.reference });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  // ─── Success state ────────────────────────────────────────────────────────
  if (placed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1614]">Order Placed!</h1>
          <p className="mt-3 text-[#6b5d54]">
            Thank you for your order. We&apos;ll start working on it right away.
          </p>

          <div className="mt-8 rounded-[1.5rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7764]">
              Order Reference
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-widest text-[#1a1614]">
                {placed.reference}
              </span>
              <button
                type="button"
                onClick={() => void handleCopy()}
                title="Copy reference"
                className="rounded-full border border-[#eadfcb] p-2 text-[#8c7764] transition hover:bg-[#f8f1e6] hover:text-[#1a1614]"
              >
                <ClipboardCopy className="h-4 w-4" />
              </button>
            </div>
            {copied && (
              <p className="mt-2 text-xs text-emerald-600">Copied to clipboard</p>
            )}
            <p className="mt-3 text-sm text-[#6b5d54]">
              Use this reference to track your order or contact support.
            </p>

            <div className="mt-4 border-t border-[#eadfcb] pt-4 text-sm text-[#6b5d54]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-[#1a1614]">{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-[#1a1614]">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span>{taxLabel}</span>
                <span className="font-medium text-[#1a1614]">{formatPrice(tax)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-[#eadfcb] pt-3 text-base font-bold text-[#1a1614]">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/orders/${placed.orderId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a1614] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2624]"
            >
              View Order Details
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#eadfcb] px-6 py-3 text-sm font-semibold text-[#1a1614] transition hover:bg-[#f8f1e6]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Checkout form ────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <Link
          href="/cart"
          className="mb-4 inline-flex items-center gap-2 text-[#6b5d54] transition-colors hover:text-[#1a1614]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>
        <h1 className="text-3xl font-bold text-[#1a1614]">Checkout</h1>
        <p className="mt-1 text-[#6b5d54]">
          {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your order
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ── Left column ── */}
          <div className="space-y-6">
            {/* Shipping */}
            <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-[#1a1614]">
                <Truck className="h-5 w-5" />
                Shipping Information
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>First Name <span className="text-red-500">*</span></label>
                    <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={INPUT} placeholder="Jane" />
                  </div>
                  <div>
                    <label className={LABEL}>Last Name <span className="text-red-500">*</span></label>
                    <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={INPUT} placeholder="Doe" />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} placeholder="jane@example.com" />
                </div>

                <div>
                  <label className={LABEL}>Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} placeholder="(555) 123-4567" />
                </div>

                <div>
                  <label className={LABEL}>Street Address <span className="text-red-500">*</span></label>
                  <input required value={address} onChange={(e) => setAddress(e.target.value)} className={INPUT} placeholder="123 Main Street" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>City <span className="text-red-500">*</span></label>
                    <input required value={city} onChange={(e) => setCity(e.target.value)} className={INPUT} placeholder="New York" />
                  </div>
                  <div>
                    <label className={LABEL}>ZIP / Postal Code <span className="text-red-500">*</span></label>
                    <input required value={zip} onChange={(e) => setZip(e.target.value)} className={INPUT} placeholder="10001" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Country <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={country}
                      onChange={(e) => { setCountry(e.target.value); setState(""); }}
                      className={INPUT}
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>
                      {country === "US" ? "State" : "Province / Region"}
                      {country === "US" && <span className="text-red-500"> *</span>}
                    </label>
                    {country === "US" ? (
                      <select
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className={INPUT}
                      >
                        <option value="">Select state</option>
                        {US_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className={INPUT}
                        placeholder="Province / Region"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment (placeholder) */}
            <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-[#1a1614]">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </h2>

              <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Secure Payment</span>
                </div>
                <p className="mt-1 text-sm text-yellow-700">
                  Your payment details are encrypted with SSL. We never store card numbers.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={LABEL}>Card Number</label>
                  <input type="text" className={INPUT} placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Expiry</label>
                    <input type="text" className={INPUT} placeholder="MM / YY" maxLength={7} />
                  </div>
                  <div>
                    <label className={LABEL}>CVV</label>
                    <input type="text" className={INPUT} placeholder="123" maxLength={4} />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Name on Card</label>
                  <input type="text" className={INPUT} placeholder="Jane Doe" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: Order Summary ── */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[1.75rem] border-2 border-[#eadfcb] bg-white p-6 shadow-[0_10px_30px_rgba(26,22,20,0.06)]">
              <h2 className="mb-6 text-xl font-semibold text-[#1a1614]">Order Summary</h2>

              {/* Line items */}
              <div className="space-y-4">
                {lineItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#eadfcb] bg-[#faf6ef]">
                      <Image
                        src={item.product.imageUrl || FALLBACK_IMG}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                    </div>
                    <div className="flex flex-1 items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#1a1614]">
                          {item.product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[#6b5d54]">
                          {item.variant?.name || "Standard"} &times; {item.quantity}
                        </p>
                        <p className="mt-0.5 text-xs text-[#8c7764]">
                          {formatPrice(item.unitCents)} each
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-[#1a1614]">
                        {formatPrice(item.totalCents)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="mt-6 space-y-2.5 border-t border-[#eadfcb] pt-5 text-sm text-[#6b5d54]">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? "s" : ""})</span>
                  <span className="font-medium text-[#1a1614]">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>
                    Shipping
                    {shipping === 0 && (
                      <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Free
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-[#1a1614]">
                    {shipping === 0 ? "$0.00" : formatPrice(shipping)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs leading-5">{taxLabel}</span>
                  <span className="font-medium text-[#1a1614]">
                    {state || country !== "US" ? formatPrice(tax) : "—"}
                  </span>
                </div>

                <div className="flex justify-between border-t border-[#eadfcb] pt-3 text-base font-bold text-[#1a1614]">
                  <span>Total</span>
                  <span>{state || country !== "US" ? formatPrice(total) : "—"}</span>
                </div>
              </div>

              {formError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={placing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1614] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#2a2624] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {placing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {placing ? "Placing order…" : "Complete Order"}
              </button>

              <p className="mt-3 text-center text-xs text-[#8c7764]">
                By completing your order you agree to our terms of service and privacy policy.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
