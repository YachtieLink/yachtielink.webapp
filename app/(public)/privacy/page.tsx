import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — YachtieLink',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 pb-24">
      <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">Last updated: 15 March 2026</p>

      <section className="prose prose-sm max-w-none space-y-8 text-[var(--foreground)]">

        <div>
          <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>Account information (name, email, phone)</li>
            <li>Professional information (employment history, certifications)</li>
            <li>Content you create (endorsements, bio, profile data)</li>
            <li>Usage data (page views, feature usage via PostHog analytics)</li>
            <li>Payment information (processed by Stripe — we do not store card details)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>To provide and improve the YachtieLink service</li>
            <li>To display your public profile to other users and recruiters</li>
            <li>To send transactional emails (endorsement requests, cert expiry alerts, billing)</li>
            <li>To improve the service using anonymised analytics</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. Information Sharing</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>Your public profile is visible to anyone with the link (contact info visibility is controlled by your settings).</li>
            <li>We do not sell your data.</li>
            <li>We share payment data with Stripe for billing purposes.</li>
            <li>We use PostHog for analytics (stored in their EU infrastructure).</li>
            <li>We use Sentry for error tracking (anonymised error data only).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Data Storage</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>Data is stored in the EU (Supabase EU region).</li>
            <li>Files (photos, documents, CVs) are stored securely with access controls.</li>
            <li>Passwords are managed by Supabase Auth (bcrypt hashed; we never see them).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Your Rights (GDPR)</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li><strong>Access:</strong> View your data in your profile at any time.</li>
            <li><strong>Export:</strong> Download all your data as JSON from account settings.</li>
            <li><strong>Deletion:</strong> Delete your account and all personal data from account settings.</li>
            <li><strong>Correction:</strong> Edit your profile at any time.</li>
            <li><strong>Portability:</strong> Export your data and take it elsewhere.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Cookies</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>We use essential cookies only (authentication session management).</li>
            <li>No tracking cookies are set.</li>
            <li>PostHog analytics uses localStorage, not cookies.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Data Retention</h2>
          <ul className="list-disc list-inside text-[var(--muted-foreground)] space-y-1 leading-relaxed">
            <li>Active accounts: data retained while account is active.</li>
            <li>Deleted accounts: personal data removed within 30 days of deletion request.</li>
            <li>Anonymised analytics data may be retained indefinitely.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">8. Children</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            YachtieLink is for professional use by adults only. We do not knowingly collect data
            from anyone under 18. If you believe a minor has created an account, please contact us.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">9. Changes to This Policy</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            We will notify users of material changes to this policy via email before they take effect.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">10. Contact</h2>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            Data Controller: YachtieLink{' '}
            <span className="text-xs italic">[LEGAL REVIEW NEEDED — company entity name and address to be confirmed]</span>
            <br />
            Email:{' '}
            <a href="mailto:ari@yachtie.link" className="underline">ari@yachtie.link</a>
          </p>
        </div>

      </section>
    </div>
  );
}
