import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Learn how QuickToolBox handles information when you use its online tools.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page" style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(24px, 5vw, 56px) 20px', lineHeight: 1.7 }}>
      <p><Link href="/">← Back to QuickToolBox</Link></p>
      <h1>Privacy Policy</h1>
      <p><strong>Last updated: October 29, 2026</strong></p>
      <p>QuickToolBox provides browser-based utilities and optional AI-powered features. This page explains, in general terms, how information may be handled when you use the site.</p>
      <h2>Information you enter</h2>
      <p>Information you type or upload may be processed on your device for tools designed to run in your browser. Do not assume every tool is local: features that call an AI provider, URL-shortening service, or another external service may send the information needed to provide that feature to that service.</p>
      <h2>AI features and external services</h2>
      <p>When you use an AI feature, your prompt and the context required to answer it may be sent to the AI provider configured for the service. The provider's own privacy terms and retention practices may apply. Avoid submitting passwords, financial details, confidential documents, or other sensitive information.</p>
      <h2>Accounts and authentication</h2>
      <p>If you use sign-in features, authentication is handled through the configured authentication service. Account and session information may be processed to provide sign-in, account security, and session management.</p>
      <h2>Cookies, analytics and advertising</h2>
      <p>The site may use service-related storage, performance measurement, or advertising technologies where configured. Third-party providers may collect information according to their own policies and browser settings.</p>
      <h2>Files and downloads</h2>
      <p>For browser-based file tools, files are intended to be handled in your browser where the feature supports local processing. Check the description of the specific tool before using it with private files. Downloaded output is saved through your browser.</p>
      <h2>Children</h2>
      <p>QuickToolBox is a general-purpose utility site and is not designed to knowingly collect personal information from children.</p>
      <h2>Changes to this policy</h2>
      <p>This policy may be updated as features and service providers change. The updated date at the top of this page indicates the latest revision.</p>
      <h2>Questions</h2>
      <p>For now, please use the site's available contact or support options if you have a privacy question. Do not send secrets or sensitive personal information in a support request.</p>
    </main>
  );
}
