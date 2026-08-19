import Link from 'next/link';
import { studentTools, studentSlugs } from '../../../lib/tools';
import StudentToolClient from './StudentToolClient';

export function generateStaticParams() {
  return studentSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const meta = studentTools.find(([s]) => s === slug);
  return {
    title: meta ? `${meta[2]} | QuickToolBox` : 'Student Tool | QuickToolBox',
    description: meta ? meta[3] : 'Free student tools.',
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const meta = studentTools.find(([s]) => s === slug);

  if (!meta) {
    return (
      <>
        <header>
          <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
          <Link href="/student-tools">← All student tools</Link>
        </header>
        <main className="tool">
          <h1>Tool not found</h1>
          <p>This student tool does not exist. Browse the full list instead.</p>
          <Link className="btn" href="/student-tools">See all student tools →</Link>
        </main>
      </>
    );
  }

  return <StudentToolClient slug={slug} icon={meta[1]} title={meta[2]} desc={meta[3]} />;
}
