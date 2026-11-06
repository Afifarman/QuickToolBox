import Link from 'next/link';

export const metadata = {
  title: 'Contact QuickToolBox',
  description: 'How to find support information for QuickToolBox.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(24px, 5vw, 56px) 20px', lineHeight: 1.7 }}>
      <p><Link href="/">← Back to QuickToolBox</Link></p>
      <h1>Contact QuickToolBox</h1>
      <p>Thanks for using QuickToolBox. If a tool is not working, please note the tool name, the browser and device you are using, what you expected to happen, and any non-sensitive error message shown on screen.</p>
      <p>Use the support or contact method provided on the official QuickToolBox project page if one is available. Do not include passwords, API keys, authentication tokens, or private documents in a bug report.</p>
    </main>
  );
}
