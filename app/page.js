import Link from 'next/link';

const tools = [
  ['pdf-merge','📑','PDF Merge','Merge multiple PDF files in your browser.'],['pdf-split','✂️','PDF Split','Split a PDF into selected pages.'],['pdf-compressor','🗜️','PDF Compressor','Optimize and save a PDF locally.'],['image-to-pdf','🖼️','Image → PDF','Convert JPG/PNG images to a PDF.'],['passport-photo-maker','🪪','Passport Photo Maker','Create a standard 2×2 inch passport photo.'],['gpa-calculator','🎓','GPA/CGPA Calculator','Calculate GPA or CGPA from course grades.'],['emi-calculator','🏦','EMI Calculator','Calculate monthly loan EMI and total interest.'],['salary-calculator','💵','Salary Calculator','Estimate net salary from gross salary.'],['tax-vat-calculator','🧾','Tax/VAT Calculator','Calculate VAT and simple income tax estimates.'],['invoice-generator','🧮','Invoice Generator','Create and print a professional invoice.'],['cover-letter-builder','✉️','Cover Letter Builder','Generate a professional cover letter.'],['qr-scanner','📷','QR Scanner','Scan a QR code with your camera when supported.'],['url-shortener','🔗','URL Shortener','Shorten a URL using a public shortening service.'],['json-formatter','{}','JSON Formatter','Format, validate and minify JSON.'],['favicon-generator','⭐','Favicon Generator','Create a favicon from an image.'],['meta-tag-generator','🏷️','Meta Tag Generator','Generate SEO meta tags.'],['sitemap-generator','🗺️','Sitemap Generator','Generate XML sitemap content from URLs.'],['password-strength-checker','🔐','Password Strength Checker','Check password strength locally.'],['world-clock','🌍','World Clock / Timezone','View current time across time zones.']
];

const aiTools = [
  ['ai','🤖','AI Assistant','Generate, rewrite, summarize and improve text with AI.'],
  ['cv-maker','📄','AI CV Maker','Build a professional CV with AI-assisted content.']
];

const studentTools = [
  ['grade-calculator','📊','Grade & Percentage Calculator','Enter marks and total marks.'],['assignment-planner','📝','Assignment Planner','Add assignments and deadlines. Saved locally.'],['study-timetable','📅','Study Timetable Generator','Enter subjects and available study hours.'],['pomodoro-timer','⏱️','Pomodoro Study Timer','Focus with a 25-minute study session and 5-minute break.'],['study-time-calculator','⏰','Study Time Calculator','Split your target study hours across days.'],['scientific-calculator','🔢','Scientific Calculator','Calculate arithmetic and common scientific expressions.'],['math-problem-solver','📐','Math Problem Solver','Solve arithmetic, percentages and simple linear equations.'],['citation-generator','📚','Citation Generator','Generate APA, MLA or Chicago-style basic citations.'],['essay-outline-generator','✍️','Essay Outline Generator','Create a clear essay structure from your topic.'],['flashcard-generator','🧠','Flashcard Generator','Create editable Q&A flashcards from notes.'],['quiz-generator','❓','Quiz Generator','Create practice questions from notes.'],['ai-study-assistant','🤖','AI Study Assistant','Send a study question to the site AI endpoint when configured.'],['notes-summarizer','📄','Notes Summarizer','Make a concise local summary from notes.'],['grammar-checker','🔤','Grammar Checker','Detect common spacing, capitalization and punctuation issues.'],['student-translator','🌐','Student Translator','Use the browser translation API when supported.'],['pdf-notes-extractor','📑','PDF Study Notes Extractor','Extract text from a selectable PDF using the browser File API.'],['semester-result-calculator','📈','Semester Result Calculator','Calculate weighted GPA from credits and grade points.'],['exam-countdown','🎓','Exam Countdown','Set an exam date and see the remaining time.'],['student-budget-calculator','💰','Student Budget Calculator','Compare monthly income with student expenses.'],['assignment-checklist','☑️','Assignment Checklist','Create, complete and remove tasks. Saved locally.'],['study-notes-organizer','🗂️','Study Notes Organizer','Store subject notes locally in your browser.']
];

function ToolGrid({ items }) { return <div className="grid">{items.map(([slug,icon,title,desc], i) => <Link className="card" href={slug === 'ai' ? '/ai' : `/${items === aiTools ? '' : 'tools/'}${slug}`} key={`${slug}-${i}`}><i>{icon}</i><div><h3>{title}</h3><p>{desc}</p></div><strong>→</strong></Link>)}</div>; }

export default function Home() {
  return <>
    <header><Link className="brand" href="/"><b>Q</b> QuickToolBox</Link><nav><a href="#tools">Tools</a><a href="#ai">AI & CV</a><a href="#student-tools">Student</a><Link href="/login">Login / Register</Link><Link href="/dashboard">Dashboard</Link></nav></header>
    <main>
      <section className="hero"><small>⚡ FREE • FAST • SIMPLE • AI</small><h1>One toolbox.<br/><span>Everything useful.</span></h1><p>Fast, privacy-friendly PDF, calculator, productivity, student and AI tools designed for phones, tablets and computers.</p><a className="btn" href="#tools">Explore tools →</a></section>
      <section id="tools"><small>TOOLBOX</small><h2>19 essential tools.</h2><ToolGrid items={tools}/></section>
      <section id="ai"><small>AI & CV</small><h2>AI tools without duplicates.</h2><ToolGrid items={aiTools}/></section>
      <section id="student-tools"><small>STUDENT TOOLS</small><h2>{studentTools.length} useful tools for students.</h2><ToolGrid items={studentTools}/></section>
      <section id="about" className="about"><small>WHY QUICKTOOLBOX?</small><h2>Fast, private and mobile-friendly.</h2><div className="features"><div>⚡ <b>Fast</b><p>Lightweight browser-first tools.</p></div><div>🔒 <b>Private</b><p>Local file tools process files in your browser.</p></div><div>📱 <b>Responsive</b><p>Designed for phones, tablets and computers.</p></div></div></section>
    </main>
    <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
  </>;
}
