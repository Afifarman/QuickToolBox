import Link from 'next/link';

export const metadata = { title: 'Page not found | QuickToolBox' };

export default function NotFound() {
  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/tools">Tools</Link><Link href="/student-tools">Student</Link></nav>
      </header>
      <main className="page">
        <small>404</small>
        <h1>Page not found</h1>
        <p>That page doesn’t exist — but 52 free tools do.</p>
        <div style={{ marginTop: 10 }}>
          <Link className="btn" href="/tools">Browse all tools →</Link>
          <Link className="btn light" href="/">Go home</Link>
        </div>
      </main>
      <footer>© 2026 QuickToolBox</footer>
    </>
  );
}
