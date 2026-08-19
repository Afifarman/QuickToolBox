import Link from 'next/link';

const studentTools = [
  ['grade-calculator','📊','Grade & Percentage Calculator'],
  ['assignment-planner','📝','Assignment Planner'],
  ['study-timetable','📅','Study Timetable Generator'],
  ['pomodoro-timer','⏱️','Pomodoro Study Timer'],
  ['study-time-calculator','⏰','Study Time Calculator'],
  ['scientific-calculator','🔢','Scientific Calculator'],
  ['math-problem-solver','📐','Math Problem Solver'],
  ['citation-generator','📚','Citation Generator'],
  ['essay-outline-generator','✍️','Essay Outline Generator'],
  ['flashcard-generator','🧠','Flashcard Generator'],
  ['quiz-generator','❓','Quiz Generator'],
  ['ai-study-assistant','🤖','AI Study Assistant'],
  ['notes-summarizer','📄','Notes Summarizer'],
  ['grammar-checker','🔤','Grammar Checker'],
  ['student-translator','🌐','Student Translator'],
  ['pdf-notes-extractor','📑','PDF Study Notes Extractor'],
  ['semester-result-calculator','📈','Semester Result Calculator'],
  ['exam-countdown','🎓','Exam Countdown'],
  ['student-budget-calculator','💰','Student Budget Calculator'],
  ['assignment-checklist','☑️','Assignment Checklist'],
  ['study-notes-organizer','🗂️','Study Notes Organizer']
];

export default function StudentToolsIndex() {
  return (
    <main style={{maxWidth:1100,margin:'0 auto',padding:'32px 16px'}}>
      <p><Link href="/">← Home</Link></p>
      <h1>Student tools</h1>
      <p>GPA, planners, timers, writing helpers and study utilities.</p>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16,marginTop:24}}>
        {studentTools.map(([slug,icon,name]) => (
          <Link key={slug} href={`/student-tools/${slug}`} style={{display:'block',padding:20,border:'1px solid #ddd',borderRadius:12}}>
            <strong>{icon} {name}</strong>
            <div style={{marginTop:8}}>Open tool →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
