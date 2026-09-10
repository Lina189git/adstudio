import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/painting-order/AppHeader";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Oil Painting AI Studio Terms of Service before placing an order or using our AI Studio.",
};

const LAST_UPDATED = "1 June 2025";
const COMPANY = "Oil Painting AI Studio";
const EMAIL = "support@oilpaintingstudio.com";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8f1e6]">
      <AppHeader />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#a87945]">Legal</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#1a1614]">Terms of Service</h1>
          <p className="mt-2 text-sm text-[#8c7764]">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 rounded-[2rem] border-2 border-[#eadfcb] bg-white p-8 shadow-[0_8px_32px_rgba(26,22,20,0.06)] text-[#3e322a] [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#1a1614] [&_h2]:mb-3 [&_p]:leading-relaxed [&_p]:text-[#6b5d54] [&_ul]:space-y-2 [&_ul]:text-[#6b5d54] [&_li]:leading-relaxed">

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using {COMPANY} (&ldquo;the Service&rdquo;), you agree to be bound by
              these Terms of Service and our Privacy Policy. If you do not agree, please do not use
              the Service.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              {COMPANY} provides an online platform for purchasing handcrafted oil paintings,
              commissioning custom artworks, and generating AI-powered oil-painting style transfers
              using OpenAI technology. Products are delivered as physical canvas prints or digital
              files, as selected during checkout.
            </p>
          </section>

          <section>
            <h2>3. Orders and Payment</h2>
            <ul className="list-disc pl-5">
              <li>All prices are displayed in USD and are subject to change without notice.</li>
              <li>Payment is processed securely via Stripe. We do not store your card details.</li>
              <li>Orders are confirmed by email after successful payment.</li>
              <li>We reserve the right to cancel any order and issue a full refund at our discretion.</li>
              <li>Applicable taxes are calculated and added at checkout based on your location.</li>
            </ul>
          </section>

          <section>
            <h2>4. Custom Commissions</h2>
            <p>
              Commission requests submitted through our order form are non-binding until confirmed
              by our team with a formal quote. Production begins only after the customer approves
              the quote and makes payment. Rush orders are subject to additional fees and
              availability.
            </p>
          </section>

          <section>
            <h2>5. AI-Generated Artwork</h2>
            <p>
              AI-generated paintings are created using OpenAI&rsquo;s image generation technology.
              By uploading a photo you confirm that you own the rights to that image or have
              obtained the necessary permissions. {COMPANY} is not responsible for
              AI-generated content that does not meet your exact expectations, though we will work
              with you to find a satisfactory resolution.
            </p>
          </section>

          <section>
            <h2>6. Returns and Refunds</h2>
            <ul className="list-disc pl-5">
              <li>Physical canvas prints: 30-day return window from the date of delivery for undamaged items.</li>
              <li>Custom commissions and personalised orders are non-refundable once production has begun.</li>
              <li>Digital downloads are non-refundable once the file has been accessed.</li>
              <li>If your order arrives damaged, contact us within 7 days with photographs and we will arrange a replacement or refund.</li>
            </ul>
          </section>

          <section>
            <h2>7. Intellectual Property</h2>
            <p>
              All original artwork, site content, and branding remain the intellectual property of
              {" "}{COMPANY}. Upon purchase, you receive a personal, non-exclusive licence to display
              and enjoy the artwork. Resale, reproduction, or commercial use requires written
              permission.
            </p>
          </section>

          <section>
            <h2>8. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials.
              You may not share your account with third parties. We reserve the right to suspend or
              terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, {COMPANY} shall not be liable for any
              indirect, incidental, or consequential damages arising from your use of the Service.
              Our total liability shall not exceed the amount you paid for the specific order giving
              rise to the claim.
            </p>
          </section>

          <section>
            <h2>10. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after
              changes are posted constitutes acceptance of the revised Terms. The date at the top
              of this page reflects when the Terms were last updated.
            </p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>
              For questions about these Terms, please email us at{" "}
              <a href={`mailto:${EMAIL}`} className="text-[#d4a574] hover:underline">{EMAIL}</a>.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/privacy" className="text-[#d4a574] hover:underline">
            Privacy Policy →
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
