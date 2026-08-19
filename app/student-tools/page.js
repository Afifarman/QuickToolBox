import Link from 'next/link';

const studentTools = [
  ['grade-calculator', '📊', 'Grade & Percentage Calculator', 'Enter marks and total marks.'],
  ['assignment-planner', '📝', 'Assignment Planner', 'Add assignments and deadlines. Saved locally.'],
  ['study-timetable', '📅', 'Study Timetable Generator', 'Enter subjects and available study hours.'],
  ['pomodoro-timer', '⏱️', 'Pomodoro Study Timer', 'Focus with a 25-minute study session and a 5-minute break.'],
  ['study-time-calculator', '⏰', 'Study Time Calculator', 'Split your target study hours across days.'],
  ['scientific-calculator', '🔢', 'Scientific Calculator', 'Calculate arithmetic and common scientific expressions.'],
  ['math-problem-solver', '📐', 'Math Problem Solver', 'Solve arithmetic, percentages and simple linear equations.'],
  ['citation-generator', '📚', 'Citation Generator', 'Generate APA, MLA or Chicago-style basic citations.'],
  ['essay-outline-generator', '✍️', 'Essay Outline Generator', 'Create a clear essay structure from your topic.'],
  ['flashcard-generator', '🧠', 'Flashcard Generator', 'Create editable Q&A flashcards from notes.'],
  ['quiz-generator', '❓', 'Quiz Generator', 'Create practice questions from notes.'],
  ['ai-study-assistant', '🤖', 'AI Study Assistant', 'Ask a study question and get a clear explanation.'],
  ['notes-summarizer', '📄', 'Notes Summarizer', 'Make a concise local summary from notes.'],
  ['grammar-checker', '🔤', 'Grammar Checker', 'Detect common spacing, capitalization and punctuation issues.'],
  ['student-translator', '🌐', 'Student Translator', 'Use the browser translation API when supported.'],
  ['pdf-notes-extractor', '📑', 'PDF Study Notes Extractor', 'Extract text from a selectable PDF using the browser File API.'],
  ['semester-result-calculator', '📈', 'Semester Result Calculator', 'Calculate weighted GPA from credits and grade points.'],
  ['exam-countdown', '🎓', 'Exam Countdown', 'Set an exam date and see the remaining time.'],
  ['student-budget-calculator', '💰', 'Student Budget Calculator', 'Compare monthly income with student expenses.'],
  ['assignment-checklist', '☑️', 'Assignment Checklist', 'Create, complete and remove tasks. Saved locally.'],
  ['study-notes-organizer', '🗂️', 'Study Notes Organizer', 'Store subject notes locally in your browser.'],
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
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 20px 80px' }}>
        <small>STUDENT TOOLS</small>
        <h1>Useful tools for students.</h1>
        <p>GPA, planners, flashcards, study timers and an AI study assistant.</p>
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
