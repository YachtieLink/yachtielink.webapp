import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — YachtieLink',
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 pb-24">
      <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">Last updated: 15 March 2026</p>

      <section className="prose prose-sm max-w-none space-y-8 text-[var(--foreground)]">

        <div>
          <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            By accessing or using YachtieLink (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service.
            If you do not agree, do not use the Service.
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
            <li>By posting content, you grant YachtieLink a licence to display it on the Service.</li>
            <li>You must not post false, misleading, or defamatory information.</li>
            <li>Endorsements must reflect genuine professional experience.</li>
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
            <li>Pricing: EUR 12/month or EUR 9/month billed annually (standard rates).</li>
            <li>Founding member pricing is locked in permanently for qualifying early subscribers.</li>
            <li>You may cancel at any time via your account settings.</li>
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
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Termination</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>We may suspend or terminate accounts that violate these terms.</li>
            <li>You may delete your account at any time from your account settings.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">8. Limitation of Liability</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>YachtieLink is provided &ldquo;as is&rdquo; without warranties of any kind.</li>
            <li>We do not verify employment claims or endorsements.</li>
            <li>We are not responsible for hiring decisions made based on profiles.</li>
          </ul>
          <p className="text-[var(--muted-foreground)] leading-relaxed mt-2 text-xs italic">
            [LEGAL REVIEW NEEDED — liability caps and jurisdiction-specific language to be added before launch]
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">9. Governing Law</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed text-xs italic">
            [LEGAL REVIEW NEEDED — governing law and dispute resolution to be confirmed based on company registration jurisdiction]
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">10. Contact</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            Questions about these Terms?{' '}
            <a href="mailto:ari@yachtie.link" className="underline">ari@yachtie.link</a>
          </p>
        </div>

      </section>
    </div>
  );
}
