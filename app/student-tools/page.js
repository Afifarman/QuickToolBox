import Link from 'next/link';

const tools = [
 ['gpa-cgpa-calculator','🎓','GPA / CGPA Calculator','Calculate semester GPA and cumulative CGPA.'],
 ['grade-calculator','📊','Grade & Percentage Calculator','Convert marks to percentage, grade and GPA.'],
 ['assignment-planner','📝','Assignment Planner','Track assignments, deadlines and priorities.'],
 ['study-timetable','📅','Study Timetable Generator','Build a weekly study schedule around your subjects.'],
 ['pomodoro-timer','⏱️','Pomodoro Study Timer','Focus in timed study and break sessions.'],
 ['study-time-calculator','⏰','Study Time Calculator','Plan study hours across days and subjects.'],
 ['scientific-calculator','🔢','Scientific Calculator','Fast scientific calculations in your browser.'],
 ['math-problem-solver','📐','Math Problem Solver','Solve common arithmetic, percentage and equation problems.'],
 ['word-character-counter','📖','Word & Character Counter','Count words, characters, lines and reading time.'],
 ['citation-generator','📚','Citation Generator','Create basic APA, MLA and Chicago citations.'],
 ['essay-outline-generator','✍️','Essay Outline Generator','Create a structured essay outline from a topic.'],
 ['flashcard-generator','🧠','Flashcard Generator','Turn notes into editable question-and-answer cards.'],
 ['quiz-generator','❓','Quiz Generator','Create a practice quiz from your notes.'],
 ['ai-study-assistant','🤖','AI Study Assistant','Ask AI to explain, summarize or quiz you.'],
 ['notes-summarizer','📄','Notes Summarizer','Create a concise study summary from notes.'],
 ['grammar-checker','🔤','Grammar Checker','Find common punctuation and wording issues.'],
 ['student-translator','🌐','Student Translator','Translate short study text using the browser language API when available.'],
 ['pdf-notes-extractor','📑','PDF Study Notes Extractor','Extract selectable PDF text for study notes.'],
 ['semester-result-calculator','📈','Semester Result Calculator','Estimate result and CGPA from course credits and grades.'],
 ['exam-countdown','🎓','Exam Countdown','Count days, hours and minutes until an exam.'],
 ['student-budget-calculator','💰','Student Budget Calculator','Plan monthly student income and expenses.'],
 ['notes-qr-generator','🔗','Notes QR Generator','Create a QR-ready link for notes or resources.'],
 ['assignment-checklist','☑️','Assignment Checklist','Create and manage an assignment checklist.'],
 ['study-notes-organizer','🗂️','Study Notes Organizer','Organize subjects and notes locally in your browser.']
];

export default function StudentToolsPage(){
 return <main style={{maxWidth:1100,margin:'0 auto',padding:'32px 16px'}}>
  <div style={{marginBottom:28}}><small>🎓 STUDENT TOOLS</small><h1>Student Tools</h1><p>24 practical tools for study, assignments, exams, writing and results.</p></div>
  <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:16}}>
   {tools.map(([slug,icon,name,desc])=><Link key={slug} href={`/student-tools/${slug}`} style={{display:'block',padding:20,border:'1px solid #ddd',borderRadius:16,textDecoration:'none'}}><div style={{fontSize:28}}>{icon}</div><h2 style={{fontSize:18,margin:'10px 0 6px'}}>{name}</h2><p style={{margin:0,opacity:.75}}>{desc}</p><strong style={{display:'block',marginTop:14}}>Open →</strong></Link>)}
  </section>
 </main>
}
