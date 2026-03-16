import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — YachtieLink',
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 pb-24">
      <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">Last updated: 16 March 2026</p>

      <section className="prose prose-sm max-w-none space-y-8 text-[var(--foreground)]">

        <div>
          <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            By registering for or using YachtieLink (&ldquo;the Service&rdquo;), you agree to be bound by
            these Terms of Service and our{' '}
            <a href="/privacy" className="underline">Privacy Policy</a>. You must be at least 18 years
            old to use the Service. If you do not agree, do not use the Service.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2">
            We may update these Terms from time to time. We will notify you of material changes by
            email at least 14 days before they take effect. Your continued use of the Service after
            the effective date constitutes acceptance of the updated Terms.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. Account Registration</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>One account per person. Multiple accounts are not permitted.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. User Content</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>You own the content you post (profile, bio, endorsements).</li>
            <li>
              By posting content, you grant YachtieLink a non-exclusive, worldwide, royalty-free
              licence to host, store, reproduce, transmit, display, and distribute that content
              solely for the purposes of operating and improving the Service. This licence terminates
              when you delete your content or account, subject to any technical or legal retention
              obligations.
            </li>
            <li>You must not post false, misleading, or defamatory information.</li>
            <li>Endorsements must reflect genuine professional experience.</li>
            <li>You must not upload or share content that infringes the intellectual property rights of any third party.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Endorsement Rules</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>Endorsements require that you and the recipient have shared yacht employment.</li>
            <li>You may edit or delete endorsements you have written at any time.</li>
            <li>Fake or fabricated endorsements may result in account suspension.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Crew Pro Subscription</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>Pricing: EUR 8.99/month or EUR 5.83/month billed annually. All prices are inclusive of applicable VAT unless otherwise stated.</li>
            <li>Founding member pricing is locked in permanently for qualifying early subscribers.</li>
            <li>
              Subscriptions renew automatically at the end of each billing period unless cancelled
              before the renewal date. You may cancel at any time via your account settings.
            </li>
            <li>
              We will notify you by email at least 30 days before any price change takes effect.
              Continued use of the Service after the effective date constitutes acceptance of the
              new pricing.
            </li>
            <li>No refunds are provided for partial billing periods.</li>
            <li>Pro features are revoked upon cancellation at the end of the billing period.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Prohibited Conduct</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed mb-2">You must not:</p>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>Create fake or duplicate accounts.</li>
            <li>Harass, threaten, or abuse other users.</li>
            <li>Scrape, crawl, or make automated requests to the Service.</li>
            <li>Impersonate another person or entity.</li>
            <li>Attempt to gain unauthorised access to any part of the Service.</li>
            <li>Upload, share, or transmit content that infringes any third-party intellectual property rights.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Termination</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>We may suspend or terminate accounts that violate these Terms. Where we terminate your account other than for cause, we will provide 30 days&rsquo; notice where reasonably practicable.</li>
            <li>You may delete your account at any time from your account settings. On deletion, your personal data will be removed within 30 days in accordance with our Privacy Policy.</li>
            <li>If we terminate your account without cause, we will refund any unused prepaid subscription fees on a pro-rata basis.</li>
            <li>Sections 3, 8, 9, 10, and 11 survive termination of these Terms.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">8. Intellectual Property</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            The YachtieLink platform, including its software, design, trademarks, and content
            created by us, is owned by YachtieLink and protected by intellectual property laws.
            Nothing in these Terms grants you any right to use our name, logo, or other proprietary
            materials without our prior written consent.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">9. Limitation of Liability</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed mb-2">
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranty of any kind,
            express or implied, including warranties of merchantability, fitness for a particular
            purpose, or non-infringement. We do not verify employment claims or endorsements, and
            we are not responsible for hiring decisions made based on profiles.
          </p>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            To the fullest extent permitted by applicable law: (a) YachtieLink&rsquo;s total aggregate
            liability to you arising out of or in connection with these Terms or the Service shall
            not exceed the greater of EUR&nbsp;100 or the fees you paid to YachtieLink in the
            12&nbsp;months preceding the claim; and (b) neither party shall be liable for any
            indirect, incidental, special, consequential, or punitive damages, including loss of
            profits, data, or business opportunity, even if advised of the possibility of such
            damages. These limitations do not apply to liability for death or personal injury caused
            by negligence, fraud, or where otherwise prohibited by applicable law.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">10. Governing Law</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            These Terms are governed by the laws of France. Subject to any mandatory consumer
            protection rights you may have in your country of residence, any dispute shall be
            subject to the exclusive jurisdiction of the courts of Nice, France. For EU consumers,
            nothing in these Terms affects your right to bring proceedings in the courts of your
            country of residence.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">11. General</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</li>
            <li><strong>Entire Agreement:</strong> These Terms and our Privacy Policy constitute the entire agreement between you and YachtieLink regarding the Service and supersede any prior agreements.</li>
            <li><strong>Disputes:</strong> Before initiating formal legal proceedings, both parties agree to attempt to resolve any dispute in good faith by contacting us at{' '}
              <a href="mailto:hello@yachtie.link" className="underline">hello@yachtie.link</a>.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">12. Contact</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            Questions about these Terms?{' '}
            <a href="mailto:hello@yachtie.link" className="underline">hello@yachtie.link</a>
          </p>
        </div>

      </section>
    </div>
  );
}
