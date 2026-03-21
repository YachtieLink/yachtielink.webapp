import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — YachtieLink',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 pb-24">
      <Link href="/welcome" className="inline-block mb-6 text-sm text-[var(--color-interactive)] hover:underline">← Back to sign in</Link>
      <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">Last updated: 16 March 2026</p>

      <section className="prose prose-sm max-w-none space-y-8 text-[var(--color-text-primary)]">

        <div>
          <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
          <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 leading-relaxed">
            <li>Account information (name, email, phone)</li>
            <li>Professional information (employment history, certifications)</li>
            <li>Content you create (endorsements, bio, profile data)</li>
            <li>Usage data (page views, feature usage via PostHog analytics)</li>
            <li>Technical data (IP address, browser type, device identifiers, operating system) collected automatically when you use the Service</li>
            <li>Payment information (processed by Stripe — we do not store card details)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed mb-2">
            We process your personal data for the following purposes and on the following legal bases:
          </p>
          <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 leading-relaxed">
            <li>To provide and improve the YachtieLink service &mdash; <em>contract performance (Article 6(1)(b) GDPR)</em></li>
            <li>To display your public profile to other users and recruiters &mdash; <em>contract performance (Article 6(1)(b) GDPR)</em></li>
            <li>To send transactional emails (endorsement requests, cert expiry alerts, billing) &mdash; <em>contract performance (Article 6(1)(b) GDPR)</em></li>
            <li>To improve the service using anonymised analytics &mdash; <em>legitimate interests (Article 6(1)(f) GDPR): understanding how users interact with the Service to improve it</em></li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. Information Sharing</h2>
          <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 leading-relaxed">
            <li>Your public profile is visible to anyone with the link (contact info visibility is controlled by your settings).</li>
            <li>We do not sell your data.</li>
            <li>We share payment data with Stripe for billing purposes.</li>
            <li>We use PostHog for analytics (stored in their EU infrastructure).</li>
            <li>We use Sentry for error tracking (anonymised error data only). Sentry may process data outside the EU/EEA; where this occurs, transfers are governed by Standard Contractual Clauses.</li>
            <li>We may disclose your information where required by applicable law or in response to valid legal process (such as a court order or regulatory request).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Data Storage</h2>
          <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 leading-relaxed">
            <li>Data is stored in the EU (Supabase EU region).</li>
            <li>Files (photos, documents, CVs) are stored securely with access controls.</li>
            <li>Passwords are managed by Supabase Auth (bcrypt hashed; we never see them).</li>
            <li>Data in transit is encrypted using TLS.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Your Rights (GDPR)</h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed mb-2">
            If you are located in the EU/EEA or UK, you have the following rights regarding your personal data:
          </p>
          <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 leading-relaxed">
            <li><strong>Access:</strong> View your data in your profile at any time.</li>
            <li><strong>Export:</strong> Download all your data as JSON from account settings.</li>
            <li><strong>Deletion:</strong> Delete your account and all personal data from account settings.</li>
            <li><strong>Correction:</strong> Edit your profile at any time.</li>
            <li><strong>Portability:</strong> Export your data and take it elsewhere.</li>
            <li><strong>Object:</strong> You have the right to object to processing based on our legitimate interests. We will cease processing unless we have compelling legitimate grounds that override your interests.</li>
            <li><strong>Restrict:</strong> You may request that we restrict processing of your personal data in certain circumstances (e.g., while a correction is disputed).</li>
            <li><strong>Complain:</strong> You have the right to lodge a complaint with your national data protection authority (e.g., the Data Protection Authority in your EU country of residence) if you believe we have not handled your data in accordance with applicable law.</li>
          </ul>
          <p className="text-[var(--color-text-secondary)] leading-relaxed mt-2">
            We will respond to all rights requests within one month of receipt (extendable to three months for complex requests). To exercise any right not available directly in your account settings, contact us at{' '}
            <a href="mailto:hello@yachtie.link" className="underline">hello@yachtie.link</a>.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Cookies &amp; Local Storage</h2>
          <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 leading-relaxed">
            <li>We use essential cookies only (authentication session management).</li>
            <li>No tracking cookies are set.</li>
            <li>PostHog analytics uses localStorage rather than cookies. Depending on your jurisdiction, use of localStorage for analytics purposes may require your consent under applicable ePrivacy rules. We will update this section as our consent management practices are finalised.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Data Retention</h2>
          <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 leading-relaxed">
            <li>Active accounts: data retained while account is active.</li>
            <li>Deleted accounts: personal data removed within 30 days of deletion request.</li>
            <li>Financial and billing records: retained for up to 7 years as required by applicable tax and accounting laws, even after account deletion. Such records are retained solely to comply with legal obligations and will not be used for any other purpose.</li>
            <li>Anonymised analytics data may be retained indefinitely.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">8. Children</h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            YachtieLink is for professional use by adults only. We do not knowingly collect data
            from anyone under 18. If you believe a minor has created an account, please contact us.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">9. Automated Decision-Making</h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            We do not make any decisions about you based solely on automated processing that produce
            legal or similarly significant effects.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">10. Changes to This Policy</h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            We will notify users of material changes to this policy via email before they take effect.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">11. Contact</h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {/* TODO: Add a business/registered address here before launch — a virtual office address works fine, your home address is not required */}
            Data Controller: YachtieLink
            <br />
            Email:{' '}
            <a href="mailto:hello@yachtie.link" className="underline">hello@yachtie.link</a>
          </p>
        </div>

      </section>
    </div>
  );
}
