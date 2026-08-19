import Link from 'next/link';
import { studentTools } from '../../lib/tools';

export const metadata = {
  title: 'Student Tools | QuickToolBox',
  description: 'Free GPA calculators, planners, flashcards, summarizers and study tools for students.',
};

export default function StudentToolsPage() {
  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/tools">Tools</Link><Link href="/ai">AI</Link><Link href="/">← Home</Link></nav>
      </header>
      <main className="tool">
        <small>STUDENT TOOLS</small>
        <h1>{studentTools.length} useful tools for students</h1>
        <p>GPA, planning, revision and writing helpers — all free and mobile friendly.</p>
        <div className="grid" style={{ marginTop: 24 }}>
          {studentTools.map(([slug, icon, title, desc]) => (
            <Link className="card" href={`/student-tools/${slug}`} key={slug}>
              <i>{icon}</i>
              <div><h3>{title}</h3><p>{desc}</p></div>
              <strong>→</strong>
            </Link>
          ))}
        </div>
      </main>
      <footer>© 2026 QuickToolBox <span>Student tools.</span></footer>
    </>
  );
}
