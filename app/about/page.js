import Link from 'next/link';

export const metadata = {
  title: 'About QuickToolBox',
  description: 'About QuickToolBox, a collection of online productivity, file, student and AI tools.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(24px, 5vw, 56px) 20px', lineHeight: 1.7 }}>
      <p><Link href="/">← Back to QuickToolBox</Link></p>
      <h1>About QuickToolBox</h1>
      <p>QuickToolBox brings together practical browser-based utilities for everyday tasks, documents, images, calculations, studying and optional AI-assisted writing.</p>
      <h2>Our approach</h2>
      <ul>
        <li>Keep common tools easy to find and simple to use.</li>
        <li>Support phones, tablets and desktop browsers where features are compatible.</li>
        <li>Process files in the browser when a tool is designed for local processing.</li>
        <li>Explain when a feature depends on an external service or AI provider.</li>
      </ul>
      <p>Browser and device support can vary by tool. If something does not work, try an updated browser and avoid uploading sensitive files to external services.</p>
    </main>
  );
}
