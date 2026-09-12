import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/painting-order/AppHeader";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Goosego Terms of Service governing use of our influencer advertising platform for brands and creators.",
};

const LAST_UPDATED = "12 September 2026";
const COMPANY = "Goosego";
const SITE = "adstudio.onrender.com";
const EMAIL = "support@goosego.com";

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
              By accessing or using {COMPANY} (&ldquo;the Service&rdquo;, &ldquo;the Platform&rdquo;)
              at {SITE}, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;) and
              our Privacy Policy. If you do not agree to these Terms, do not use the Service. These
              Terms apply to all users, including brands, influencer creators, and visitors.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              {COMPANY} is an ecommerce advertising platform that connects brands with influencer
              creators. Brands list products on the platform, influencer creators apply to receive
              free product samples, produce authentic video advertisements, and {COMPANY} collects
              and broadcasts those ads across digital channels including TikTok, Instagram Reels,
              YouTube Shorts, Facebook, Pinterest, and other agreed platforms. Creators earn
              commission on sales driven by their content.
            </p>
          </section>

          <section>
            <h2>3. Eligibility</h2>
            <ul className="list-disc pl-5">
              <li>You must be at least 18 years old to create an account and use the Service.</li>
              <li>Brands must have legal authority to sell and advertise the products they list.</li>
              <li>Influencer creators must own or have rights to the social media accounts they link to their profile.</li>
              <li>You may not use the Service if you are prohibited by applicable law from doing so.</li>
            </ul>
          </section>

          <section>
            <h2>4. Brand and Advertiser Terms</h2>
            <ul className="list-disc pl-5">
              <li>Brands are responsible for ensuring all listed products are legal, accurately described, and safe to ship as samples.</li>
              <li>Product information, pricing, commission rates, and task requirements must be truthful and kept up to date.</li>
              <li>Brands agree to ship product samples promptly to approved influencer creators within the timeframe specified in the task brief.</li>
              <li>Brands grant {COMPANY} permission to display product listings, images, and descriptions on the platform and in promotional materials.</li>
              <li>Brands are responsible for paying any commissions owed to creators as specified in the task agreement.</li>
            </ul>
          </section>

          <section>
            <h2>5. Influencer Creator Terms</h2>
            <ul className="list-disc pl-5">
              <li>Creators must provide accurate profile information, including social media handles and follower counts.</li>
              <li>Creators who receive a product sample agree to produce the number and type of videos specified in the task brief within the agreed timeline.</li>
              <li>Submitted video content must meet the quality standards and requirements outlined in the Creator Partnership Agreement and task brief.</li>
              <li>Creators must disclose that content is sponsored or gifted in accordance with applicable advertising regulations (e.g. FTC guidelines, ASA rules).</li>
              <li>Creators may not misrepresent their audience size, engagement rates, or identity when applying to campaigns.</li>
              <li>Sample products received must not be resold. They are provided solely for content creation purposes.</li>
            </ul>
          </section>

          <section>
            <h2>6. Content Submission and Licensing</h2>
            <p>
              By submitting a video advertisement or any creative asset to the platform, you grant{" "}
              {COMPANY} and the relevant brand a non-exclusive, worldwide, royalty-free licence to
              use, reproduce, distribute, display, and broadcast the submitted content across agreed
              advertising channels — including TikTok, Instagram, YouTube, Facebook, and paid digital
              advertising — for the duration specified in the Creator Partnership Agreement. The
              specific platforms and usage rights are defined per task. You retain ownership of your
              content. We will not use your content beyond the agreed scope without your consent.
            </p>
          </section>

          <section>
            <h2>7. Commission and Payments</h2>
            <ul className="list-disc pl-5">
              <li>Commission rates and structures are set per product and are visible to creators before they apply.</li>
              <li>Commission is calculated based on verified sales attributable to a creator&rsquo;s content, as tracked by the platform.</li>
              <li>Payments are issued after video approval and the applicable clearance period.</li>
              <li>Partial delivery of required videos results in partial refund of the sample value in accordance with the Creator Partnership Agreement.</li>
              <li>{COMPANY} reserves the right to withhold commission if submitted content violates these Terms or the task brief.</li>
            </ul>
          </section>

          <section>
            <h2>8. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5">
              <li>Submit false, misleading, or fabricated content or performance data.</li>
              <li>Use the platform to infringe any third-party intellectual property, privacy, or publicity rights.</li>
              <li>Attempt to manipulate engagement metrics, views, or follower counts artificially.</li>
              <li>Harass, defame, or abuse other users of the platform.</li>
              <li>Resell, sublicense, or otherwise exploit product samples received through the platform.</li>
              <li>Reverse-engineer, scrape, or interfere with the platform&rsquo;s infrastructure.</li>
              <li>Create multiple accounts to circumvent bans or restrictions.</li>
            </ul>
          </section>

          <section>
            <h2>9. Intellectual Property</h2>
            <p>
              All platform content, branding, design, and technology remain the intellectual property
              of {COMPANY}. You may not reproduce, modify, or redistribute any part of the platform
              without written permission. User-submitted content remains owned by the submitting
              party, subject to the licence granted in Section 6.
            </p>
          </section>

          <section>
            <h2>10. Account Suspension and Termination</h2>
            <p>
              {COMPANY} reserves the right to suspend or permanently terminate any account that
              violates these Terms, engages in fraudulent activity, or causes harm to other users or
              brands. Upon termination, any pending commissions earned prior to the violation may be
              forfeited at our discretion. You may close your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, {COMPANY} shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your use of the
              Service, including lost revenue, lost data, or reputational harm. Our total liability
              to any user shall not exceed the total commissions or fees paid to or by that user in
              the 90 days preceding the claim.
            </p>
          </section>

          <section>
            <h2>12. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or
              implied. We do not guarantee specific campaign results, sales volumes, engagement
              rates, or platform uptime. Use of the Service is at your own risk.
            </p>
          </section>

          <section>
            <h2>13. Governing Law</h2>
            <p>
              These Terms are governed by applicable law. Any disputes arising from these Terms or
              your use of the Service shall be resolved through good-faith negotiation. If
              unresolved, disputes may be submitted to binding arbitration or the courts of competent
              jurisdiction.
            </p>
          </section>

          <section>
            <h2>14. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time to reflect changes in our service or
              applicable law. Registered users will be notified by email of material changes.
              Continued use of the Service after changes are posted constitutes acceptance of the
              revised Terms.
            </p>
          </section>

          <section>
            <h2>15. Contact Us</h2>
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
