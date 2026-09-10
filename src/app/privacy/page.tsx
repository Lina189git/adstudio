import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/painting-order/AppHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Oil Painting AI Studio collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "1 June 2025";
const COMPANY = "Oil Painting AI Studio";
const EMAIL = "privacy@oilpaintingstudio.com";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8f1e6]">
      <AppHeader />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#a87945]">Legal</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#1a1614]">Privacy Policy</h1>
          <p className="mt-2 text-sm text-[#8c7764]">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 rounded-[2rem] border-2 border-[#eadfcb] bg-white p-8 shadow-[0_8px_32px_rgba(26,22,20,0.06)] [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#1a1614] [&_h2]:mb-3 [&_p]:leading-relaxed [&_p]:text-[#6b5d54] [&_ul]:space-y-2 [&_ul]:text-[#6b5d54] [&_li]:leading-relaxed">

          <section>
            <h2>1. Who We Are</h2>
            <p>
              {COMPANY} (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates the website
              at oilpaintingstudio.com. This Privacy Policy explains how we collect, use, and protect
              your personal information when you use our Service.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <ul className="list-disc pl-5">
              <li>
                <strong className="text-[#1a1614]">Account information:</strong> Name, email address,
                and hashed password when you create an account. Google OAuth users provide name and
                email via Google.
              </li>
              <li>
                <strong className="text-[#1a1614]">Order information:</strong> Shipping address,
                phone number, and payment details (processed and stored securely by Stripe — we never
                store card numbers).
              </li>
              <li>
                <strong className="text-[#1a1614]">Uploaded images:</strong> Photos you upload for
                AI style transfer or custom commissions are stored in Cloudinary and used solely to
                fulfil your order.
              </li>
              <li>
                <strong className="text-[#1a1614]">Usage data:</strong> Pages visited, session
                duration, and device type, collected anonymously for site improvement.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <ul className="list-disc pl-5">
              <li>Processing and fulfilling your orders and commission requests.</li>
              <li>Sending order confirmation, shipping, and status update emails.</li>
              <li>Generating AI artwork previews using your uploaded images via OpenAI.</li>
              <li>Responding to customer support enquiries.</li>
              <li>Improving the Service and detecting fraud.</li>
              <li>Sending occasional marketing emails — you may unsubscribe at any time.</li>
            </ul>
          </section>

          <section>
            <h2>4. How We Share Your Information</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-5">
              <li><strong className="text-[#1a1614]">Stripe</strong> — for secure payment processing.</li>
              <li><strong className="text-[#1a1614]">Cloudinary</strong> — for image hosting and delivery.</li>
              <li><strong className="text-[#1a1614]">OpenAI</strong> — to generate AI painting previews from your uploaded photos.</li>
              <li><strong className="text-[#1a1614]">Shipping carriers</strong> — to deliver your physical orders.</li>
              <li>Law enforcement or regulators where required by law.</li>
            </ul>
          </section>

          <section>
            <h2>5. Cookies</h2>
            <p>
              We use essential cookies to maintain your session and remember cart contents.
              We do not use third-party advertising cookies. You can disable cookies in your
              browser settings, though some site features may not function correctly.
            </p>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>
              We retain your account and order data for as long as your account is active or as
              needed to fulfil legal obligations. Uploaded images used solely for AI preview
              generation that are not part of a paid order are deleted within 30 days.
            </p>
          </section>

          <section>
            <h2>7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Object to or restrict certain data processing.</li>
              <li>Data portability (receive your data in a machine-readable format).</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a href={`mailto:${EMAIL}`} className="text-[#d4a574] hover:underline">{EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2>8. Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption,
              hashed passwords, and access controls. No transmission over the internet is
              100% secure; however, we take all reasonable steps to protect your data.
            </p>
          </section>

          <section>
            <h2>9. Children&rsquo;s Privacy</h2>
            <p>
              Our Service is not directed at children under 13. We do not knowingly collect
              personal data from children. If you believe a child has provided us with data,
              please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify registered users
              by email of material changes. The date at the top reflects the most recent update.
            </p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>
              For privacy-related questions or data requests, contact us at{" "}
              <a href={`mailto:${EMAIL}`} className="text-[#d4a574] hover:underline">{EMAIL}</a>.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/terms" className="text-[#d4a574] hover:underline">
            Terms of Service →
          </Link>
          <span className="text-[#eadfcb]">|</span>
          <Link href="/" className="text-[#d4a574] hover:underline">
            Back to Home →
          </Link>
        </div>
      </div>
    </div>
  );
}
