import Link from 'next/link';

export const metadata = {
  title: 'Terms of Use',
  description: 'Terms for using QuickToolBox online tools and services.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(24px, 5vw, 56px) 20px', lineHeight: 1.7 }}>
      <p><Link href="/">← Back to QuickToolBox</Link></p>
      <h1>Terms of Use</h1>
      <p><strong>Last updated: October 29, 2026</strong></p>
      <p>By using QuickToolBox, you agree to use the site lawfully and responsibly. If you do not agree with these terms, please stop using the site.</p>
      <h2>Tools and results</h2>
      <p>The tools are provided for general informational and productivity purposes. Results may be incomplete or inaccurate and should be checked before you rely on them, especially for financial, legal, educational, health, or other important decisions.</p>
      <h2>AI and third-party services</h2>
      <p>AI features and some other tools may rely on external providers. Their availability, terms, and privacy practices may differ. Do not submit confidential or sensitive information unless you are comfortable with the applicable service's handling of it.</p>
      <h2>Acceptable use</h2>
      <p>Do not misuse the site, attempt to disrupt its operation, bypass security controls, or use its tools to violate applicable laws or the rights of others.</p>
      <h2>Availability and changes</h2>
      <p>Features may change, be temporarily unavailable, or be discontinued. We do not guarantee uninterrupted availability or that every tool will work on every device or browser.</p>
      <h2>Limitation</h2>
      <p>To the extent permitted by applicable law, QuickToolBox is provided without guarantees that outputs will be error-free or suitable for a particular purpose. You are responsible for checking outputs before use.</p>
      <h2>Changes to these terms</h2>
      <p>These terms may be updated as the site changes. The updated date above indicates the latest revision.</p>
    </main>
  );
}
