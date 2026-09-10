"use client";

import { useState } from "react";
import { CheckCircle, ChevronDown, FileText, Shield } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AgreementProduct = {
  name: string;
  basePriceCents: number;
  commissionType: string;
  commissionRate: number;
  commissionFixed: number;
  taskRequirements?: string | null;
};

export type AgreementCardProps = {
  product: AgreementProduct;
  creatorName?: string | null;
  agreedAt?: string | null;
  showCheckbox?: boolean;
  checked?: boolean;
  onCheck?: (v: boolean) => void;
  alwaysOpen?: boolean;
  adminView?: boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  "TikTok", "Instagram Reels", "YouTube", "Facebook",
  "Twitter / X", "Pinterest", "Brand website", "Paid digital advertising", "Email marketing",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const money   = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const pct     = (r: number) => `${(r * 100).toFixed(0)}%`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// ── Sub-components ────────────────────────────────────────────────────────────

function Clause({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#f0e9df] py-4 first:border-0 first:pt-0">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#8c7764]">
        Article {num} — {title}
      </p>
      <div className="space-y-1.5 text-sm leading-relaxed text-[#3a3330]">{children}</div>
    </div>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#eadfcb] bg-[#faf6ef] px-2.5 py-0.5 text-[11px] font-semibold text-[#6b5d54]">
      {children}
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function AgreementCard({
  product,
  creatorName,
  agreedAt,
  showCheckbox = false,
  checked = false,
  onCheck,
  alwaysOpen = false,
  adminView = false,
}: AgreementCardProps) {
  const [open, setOpen] = useState(alwaysOpen || showCheckbox);

  const commission = product.commissionType === "FIXED"
    ? `${money(product.commissionFixed)} fixed per approved video`
    : `${pct(product.commissionRate)} of each qualifying sale`;
  const sampleValue     = money(product.basePriceCents);
  const proRataValue    = money(Math.round(product.basePriceCents / 3));
  const effectiveDate   = agreedAt
    ? fmtDate(agreedAt)
    : fmtDate(new Date().toISOString());

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#eadfcb] bg-white shadow-[0_2px_12px_rgba(26,22,20,0.04)]">

      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => { if (!alwaysOpen) setOpen((o) => !o); }}
        className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left ${!alwaysOpen ? "transition hover:bg-[#faf6ef]" : ""}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fdf8f1]">
            <FileText className="h-5 w-5 text-[#d4a574]" />
          </div>
          <div>
            <p className="font-bold text-[#1a1614]">Creator Partnership Agreement</p>
            <p className="mt-0.5 text-xs text-[#8c7764]">{product.name} · AdStudio</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {agreedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Signed {fmtDate(agreedAt)}
            </span>
          ) : adminView ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Not yet signed
            </span>
          ) : null}
          {!alwaysOpen && (
            <ChevronDown className={`h-4 w-4 text-[#8c7764] transition-transform ${open ? "rotate-180" : ""}`} />
          )}
        </div>
      </button>

      {/* ── Body ── */}
      {open && (
        <div className="border-t border-[#eadfcb] bg-[#faf6ef] px-6 py-5">

          {/* Document header */}
          <div className="mb-5 rounded-2xl border border-[#eadfcb] bg-white px-6 py-5 text-center">
            <div className="mb-3 flex justify-center">
              <Shield className="h-7 w-7 text-[#d4a574]" />
            </div>
            <p className="text-base font-bold tracking-tight text-[#1a1614]">
              CREATOR CONTENT PARTNERSHIP AGREEMENT
            </p>
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1.5 text-left text-xs text-[#6b5d54]">
              <p><span className="font-semibold text-[#1a1614]">Company (Brand):</span> AdStudio</p>
              <p><span className="font-semibold text-[#1a1614]">Creator:</span> {creatorName || "Creator — upon signature"}</p>
              <p><span className="font-semibold text-[#1a1614]">Product:</span> {product.name}</p>
              <p><span className="font-semibold text-[#1a1614]">Effective date:</span> {effectiveDate}</p>
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-[#a89a8e]">
              This agreement is entered into between AdStudio ("Company") and the Creator named above. By electronically accepting this agreement, both parties agree to the terms set forth herein.
            </p>
          </div>

          <div className="space-y-0 rounded-2xl border border-[#eadfcb] bg-white px-6 py-4">

            <Clause num="1" title="Content Deliverables & Schedule">
              <p>The Creator agrees to produce and deliver the following promotional content in connection with the product listed above:</p>
              <ul className="mt-2 ml-4 space-y-1.5 list-disc marker:text-[#d4a574]">
                <li>
                  <strong>Initial commitment:</strong> Three (3) promotional videos, submitted within 30 days of confirmed receipt of the product sample.
                </li>
                <li>
                  <strong>Ongoing commitment:</strong> One (1) additional promotional video per calendar month, for the duration of this agreement.
                </li>
                <li>All submitted content must authentically feature the product and be of commercially acceptable quality.</li>
              </ul>
            </Clause>

            <Clause num="2" title="Intellectual Property & Media License">
              <p>
                Upon each video submission and approval, the Creator grants AdStudio a{" "}
                <strong>non-exclusive, worldwide, royalty-free license</strong> to use, reproduce, adapt, display, publicly perform, and distribute the submitted content across the following channels:
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => <SectionTag key={p}>{p}</SectionTag>)}
              </div>
              <p className="mt-3">
                <strong>License duration:</strong> 12 months from the date of each approved video. The Company may request renewal upon mutual written agreement prior to expiration.
              </p>
              <p>
                <strong>Creator retains ownership</strong> of all original content. This license does not restrict the Creator from publishing or sharing the same content independently on their own channels.
              </p>
              <p>
                The Company will make reasonable efforts to credit the Creator when sharing content, unless the Creator requests otherwise in writing.
              </p>
            </Clause>

            <Clause num="3" title="Compensation & Commission">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Agreed commission rate</p>
                <p className="mt-1 text-lg font-bold text-emerald-900">{commission}</p>
              </div>
              <ul className="mt-3 ml-4 space-y-1.5 list-disc marker:text-[#d4a574]">
                <li>Commission is earned per qualifying sale directly attributed to the Creator's content, or per approved video (as applicable per the rate type above).</li>
                <li><strong>Payment schedule:</strong> Within 30 days following official approval of each video submission.</li>
                <li><strong>Payment method:</strong> Bank transfer, business check, or digital payment platform — as confirmed in writing by both parties.</li>
                <li>Commission rates are set by the Brand and may be revised with a minimum of <strong>14 days' written notice</strong> to the Creator prior to any adjustment taking effect.</li>
                <li>Commissions for already-approved content will not be retroactively altered.</li>
              </ul>
            </Clause>

            <Clause num="4" title="Free Sample & Refund Policy">
              <div className="rounded-xl border border-[#d4a574]/30 bg-[#d4a574]/5 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8c7764]">Sample retail value</p>
                <p className="mt-1 text-xl font-bold text-[#1a1614]">{sampleValue}</p>
                <p className="text-xs text-[#8c7764]">Refunded to you by the Brand upon content delivery milestones</p>
              </div>
              <p className="mt-3">
                The product sample is provided to the Creator at no upfront cost. Upon delivery of the required video content, the Brand will issue a refund to the Creator equal to the sample&apos;s retail value on a pro-rated basis, as follows:
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-[#eadfcb]">
                <table className="w-full text-xs">
                  <thead className="bg-[#faf6ef]">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-[#8c7764]">Videos delivered</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#8c7764]">Refund issued to Creator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eadfcb]">
                    <tr className="bg-emerald-50">
                      <td className="px-3 py-2 font-semibold text-emerald-800">All 3 initial videos delivered</td>
                      <td className="px-3 py-2 font-semibold text-emerald-800">Full sample value — {sampleValue}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-[#1a1614]">2 of 3 videos delivered</td>
                      <td className="px-3 py-2 font-semibold text-amber-700">⅔ of sample — {money(Math.round(product.basePriceCents * 2 / 3))}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-[#1a1614]">1 of 3 videos delivered</td>
                      <td className="px-3 py-2 font-semibold text-orange-700">⅓ of sample — {proRataValue}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-[#1a1614]">0 videos delivered within 60 days</td>
                      <td className="px-3 py-2 font-semibold text-red-700">No refund issued</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#a89a8e]">
                Refunds are processed within 14 days of the qualifying video milestone being confirmed. Force majeure exceptions (verified illness, natural disaster, bereavement) apply with supporting documentation provided within 14 days.
              </p>
            </Clause>

            <Clause num="5" title="Content Standards & Brand Guidelines">
              {product.taskRequirements ? (
                <div className="rounded-xl border border-[#eadfcb] bg-[#faf6ef] px-4 py-3">
                  <p className="whitespace-pre-line text-[#1a1614]">{product.taskRequirements}</p>
                </div>
              ) : (
                <p>The Creator agrees to produce content that accurately and positively represents the product, without misleading claims.</p>
              )}
              <ul className="mt-2 ml-4 space-y-1.5 list-disc marker:text-[#d4a574]">
                <li>All content must include required FTC/ASA disclosures (<strong>#ad</strong> or <strong>#sponsored</strong>) where required by platform policy.</li>
                <li>Content must comply with the community guidelines of the platform on which it is published.</li>
                <li>The Brand reserves the right to request revisions for non-compliant content before releasing commission.</li>
                <li>The Creator may not make false, defamatory, or misleading statements about the product or the Brand.</li>
              </ul>
            </Clause>

            <Clause num="6" title="Exclusivity, Non-Compete & Confidentiality">
              <ul className="ml-4 space-y-1.5 list-disc marker:text-[#d4a574]">
                <li>
                  <strong>Non-compete:</strong> During the term of this agreement, the Creator agrees not to actively promote products that <em>directly compete</em> with the product listed above, without prior written consent from the Brand.
                </li>
                <li>
                  <strong>Confidentiality:</strong> Commission amounts, business terms, unreleased product information, and proprietary Brand strategies are strictly confidential. The Creator agrees not to disclose these to third parties.
                </li>
                <li>
                  <strong>No exclusivity of Creator:</strong> The Creator retains the right to partner with other non-competing brands during this agreement.
                </li>
              </ul>
            </Clause>

            <Clause num="7" title="Representations & Warranties">
              <p>Each party represents and warrants that:</p>
              <ul className="mt-2 ml-4 space-y-1.5 list-disc marker:text-[#d4a574]">
                <li>They have full authority to enter into and perform this agreement.</li>
                <li>The Creator owns or has the rights to all content they submit, including any music, imagery, or third-party material used.</li>
                <li>The submitted content does not infringe on any third-party intellectual property rights.</li>
                <li>The Brand warrants that the product sample provided is safe, accurately described, and fit for purpose.</li>
              </ul>
            </Clause>

            <Clause num="8" title="Dispute Resolution">
              <ul className="ml-4 space-y-1.5 list-disc marker:text-[#d4a574]">
                <li>Disputes will first be addressed through <strong>good-faith negotiation</strong> within 30 calendar days of written notice.</li>
                <li>Either party may submit a formal dispute through the platform&apos;s built-in dispute resolution system at any time.</li>
                <li>If unresolved after 30 days, the dispute will be referred to <strong>binding arbitration</strong> in the Company&apos;s jurisdiction under commercially standard arbitration rules.</li>
                <li>Each party bears its own legal costs unless the arbitrator determines otherwise.</li>
              </ul>
            </Clause>

            <Clause num="9" title="Termination">
              <ul className="ml-4 space-y-1.5 list-disc marker:text-[#d4a574]">
                <li>Either party may terminate this agreement with <strong>7 days&apos; written notice</strong> without cause.</li>
                <li>Immediate termination is permitted in the event of material breach, fraud, or conduct detrimental to either party&apos;s reputation.</li>
                <li>Upon termination: (a) commissions for all previously <em>approved</em> videos remain payable; (b) the media license for approved content survives termination for the full license duration; (c) pending refund obligations remain enforceable.</li>
              </ul>
            </Clause>

            <Clause num="10" title="Governing Law & Entire Agreement">
              <ul className="ml-4 space-y-1.5 list-disc marker:text-[#d4a574]">
                <li>This agreement is governed by the laws of the Company&apos;s jurisdiction.</li>
                <li>This document constitutes the entire agreement between the parties and supersedes all prior discussions regarding this partnership.</li>
                <li>Amendments require written consent from both parties.</li>
              </ul>
            </Clause>
          </div>

          {/* Agreement checkbox */}
          {showCheckbox && (
            <div className="mt-5 space-y-3">
              <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition ${
                checked
                  ? "border-[#d4a574] bg-[#d4a574]/5"
                  : "border-[#eadfcb] bg-white hover:border-[#d4a574]/50"
              }`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onCheck?.(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#d4a574]"
                />
                <div>
                  <p className="font-bold text-[#1a1614]">
                    I have read and agree to the Creator Partnership Agreement
                  </p>
                  <p className="mt-1 text-xs text-[#8c7764]">
                    Including: 3-video initial commitment · 1 video/month ongoing ·{" "}
                    {commission} commission · Media license across all listed platforms ·
                    Brand refunds up to {sampleValue} to you based on videos delivered
                  </p>
                </div>
              </label>
              {checked && (
                <p className="text-center text-xs text-[#a89a8e]">
                  Your acceptance will be recorded with a timestamp when you submit this application.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
