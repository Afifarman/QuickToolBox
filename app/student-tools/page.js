import Link from 'next/link';
import { LISTED_STUDENT_TOOLS } from '../../lib/student-tools';
import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Free Student Tools – Calculators, Planners & Study Aids',
  description:
    'Plan study time, run grade and GPA calculations, format citations and organize notes with 17 free browser-based student tools. No sign-up required.',
  path: '/student-tools',
  keywords: ['student tools', 'grade calculator', 'gpa calculator', 'study planner', 'free study tools'],
});

export default function StudentToolsPage() {
  return (
    <>
      <main className="qt-student-directory" style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 20px 80px' }}>
        <small className="student-tools-eyebrow">STUDENT TOOLKIT</small>
        <h1>Study smarter with the right tools.</h1>
        <p>Plan your study time, solve calculations, organize notes and prepare for exams—all in one place.</p>
        <div className="qt-student-directory-grid" style={{ marginTop: 28 }}>
          {LISTED_STUDENT_TOOLS.map(({ slug, icon, title, card }) => (
            <Link className="qt-student-directory-card" href={`/student-tools/${slug}`} key={slug}>
              <i>{icon}</i>
              <div>
                <h3>{title}</h3>
                <p>{card}</p>
              </div>
              <strong aria-hidden="true">→</strong>
            </Link>
          ))}
        </div>
      </main>
      <footer>
        © {new Date().getFullYear()} QuickToolBox <span>Utility + AI/CV + Student tools.</span>
      </footer>
    </>
  );
}
