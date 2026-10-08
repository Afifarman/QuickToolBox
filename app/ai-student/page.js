import Link from 'next/link';

const tools = [
  ['/student-tools/ai-study-assistant','🤖','AI Study Assistant','Ask questions and get simple explanations.'],
  ['/student-tools/notes-summarizer','📄','AI Notes Summarizer','Turn long notes into concise revision points.'],
  ['/student-tools/quiz-generator','❓','AI Quiz Generator','Turn study notes into practice questions.'],
  ['/student-tools/flashcard-generator','🧠','Flashcard Maker','Turn notes into quick Q&A revision cards.'],
  ['/student-tools/essay-outline-generator','✍️','Essay Outline AI','Build a clear essay structure from a topic.'],
  ['/student-tools/grammar-checker','🔤','AI Grammar Helper','Clean grammar, punctuation and readability.'],
];

export default function AIStudent() {
  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/ai">AI Assistant</Link><Link href="/student-tools">Student tools</Link><Link href="/">← Home</Link></nav>
      </header>
      <main style={{maxWidth:1120,margin:'0 auto',padding:'48px 20px 80px'}}>
        <small>🎓 AI STUDENT HUB</small>
        <h1>AI tools for students.</h1>
        <p style={{color:'#667085',maxWidth:700,lineHeight:1.6}}>Study smarter with AI-assisted explanations, summaries, quizzes, flashcards, essays and grammar help.</p>
        <div className="grid" style={{marginTop:28}}>
          {tools.map(([href,icon,title,desc])=><Link className="card" href={href} key={href}><span className="icon-wrap" style={{fontSize:25}}>{icon}</span><div><h3>{title}</h3><p>{desc}</p></div><span className="card-arrow">→</span></Link>)}
        </div>
      </main>
      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}
