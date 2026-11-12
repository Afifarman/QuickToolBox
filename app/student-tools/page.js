import Link from 'next/link';

const studentTools = [
  ['grade-calculator', '📊', 'Grade & Percentage Calculator', 'Calculate your percentage and grade from obtained and total marks.'],
  ['study-timetable', '📅', 'Study Timetable Generator', 'Organize your subjects into a clear, practical weekly study plan.'],
  ['study-time-calculator', '⏰', 'Study Time Calculator', 'Divide your study goal into manageable daily sessions.'],
  ['scientific-calculator', '🔢', 'Scientific Calculator', 'Work through everyday calculations and common scientific expressions.'],
  ['math-problem-solver', '📐', 'Math Problem Solver', 'Get help with arithmetic, percentages and basic linear equations.'],
  ['citation-generator', '📚', 'Citation Generator', 'Format a basic reference in APA, MLA or Chicago style.'],
  ['essay-outline-generator', '✍️', 'Essay Outline Generator', 'Turn an essay topic into a structured outline with key sections.'],
  ['quiz-generator', '❓', 'Quiz Generator', 'Turn your study notes into quick practice questions.'],
  ['notes-summarizer', '📄', 'Notes Summarizer', 'Condense your notes into a shorter, easier-to-review summary.'],
  ['grammar-checker', '🔤', 'Grammar Checker', 'Review common spacing, capitalization and punctuation issues.'],
  ['student-translator', '🌐', 'Student Translator', 'Translate text when a supported translation service is available.'],
  ['pdf-notes-extractor', '📑', 'PDF Study Notes Extractor', 'Extract selectable text from a PDF for easier study and revision.'],
  ['semester-result-calculator', '📈', 'Semester Result Calculator', 'Calculate your weighted semester GPA using course credits and grade points.'],
  ['exam-countdown', '🎓', 'Exam Countdown', 'Track the time left until your next exam.'],
  ['student-budget-calculator', '💰', 'Student Budget Calculator', 'Compare your monthly income, expenses and remaining budget.'],
  ['assignment-checklist', '☑️', 'Assignment Checklist', 'Create assignments, track progress and manage due dates on this device.'],
  ['study-notes-organizer', '🗂️', 'Study Notes Organizer', 'Keep your subject notes organized in this browser.'],
];

export default function StudentToolsPage() {
  return (
    <>
      <header>
        <Link className="brand" href="/">
          <b>Q</b> QuickToolBox
        </Link>
        <nav>
          <Link href="/ai">AI Assistant</Link>
          <Link href="/">← All tools</Link>
        </nav>
      </header>
      <main className="student-tools-directory" style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 20px 80px' }}>
        <small className="student-tools-eyebrow">STUDENT TOOLKIT</small>
        <h1>Study smarter with the right tools.</h1>
        <p>Plan your study time, solve calculations, organize notes and prepare for exams—all in one place.</p>
        <div className="grid" style={{ marginTop: 28 }}>
          {studentTools.map(([slug, icon, title, desc]) => (
            <Link className="card" href={`/student-tools/${slug}`} key={slug}>
              <i>{icon}</i>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              <strong>→</strong>
            </Link>
          ))}
        </div>
      </main>
      <footer>
        © 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span>
      </footer>
    </>
  );
}
