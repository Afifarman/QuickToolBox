import Link from 'next/link';
import dynamic from 'next/dynamic';

const ToolDiscovery = dynamic(() => import('../components/ToolDiscovery'), { ssr: true });

const tools = [
  ['pdf-merge','file','PDF Merge','Merge multiple PDF files in your browser.'],['pdf-split','scissors','PDF Split','Split a PDF into selected pages.'],['pdf-compressor','compress','PDF Compressor','Optimize and save a PDF locally.'],['image-to-pdf','image','Image → PDF','Convert JPG/PNG images to a PDF.'],['passport-photo-maker','id','Passport Photo Maker','Create a standard 2×2 inch passport photo.'],['gpa-calculator','graduation','GPA/CGPA Calculator','Calculate GPA or CGPA from course grades.'],['emi-calculator','bank','EMI Calculator','Calculate monthly loan EMI and total interest.'],['salary-calculator','money','Salary Calculator','Estimate net salary from gross salary.'],['tax-vat-calculator','receipt','Tax/VAT Calculator','Calculate VAT and simple income tax estimates.'],['invoice-generator','invoice','Invoice Generator','Create and print a professional invoice.'],['cover-letter-builder','mail','Cover Letter Builder','Generate a professional cover letter.'],['qr-scanner','qr','QR Scanner','Scan a QR code with your camera when supported.'],['url-shortener','link','URL Shortener','Shorten a URL using a public shortening service.'],['json-formatter','code','JSON Formatter','Format, validate and minify JSON.'],['favicon-generator','star','Favicon Generator','Create a favicon from an image.'],['meta-tag-generator','tag','Meta Tag Generator','Generate SEO meta tags.'],['sitemap-generator','map','Sitemap Generator','Generate XML sitemap content from URLs.'],['password-strength-checker','lock','Password Strength Checker','Check password strength locally.'],['world-clock','globe','World Clock / Timezone','View current time across time zones.']
];

const aiTools = [
  ['ai','spark','AI Assistant','Generate, rewrite, summarize and improve text. Works with configured AI providers and local fallback.'],
  ['cv-maker','document','AI CV Maker','Build a professional CV with AI-assisted content.'],
  ['ai-photo-editor','image','AI Photo Editor','Edit photos with AI-assisted instructions and browser-based adjustments.'],
  ['ai-prompts','spark','AI Prompt Generator','Create copy-ready prompts for image, study, coding, SEO and social media.']
];

const studentTools = [
  ['grade-calculator','chart','Grade & Percentage Calculator','Enter marks and total marks.'],['study-timetable','calendar','Study Timetable Generator','Enter subjects and available study hours.'],['study-time-calculator','clock','Study Time Calculator','Split your target study hours across days.'],['scientific-calculator','calculator','Scientific Calculator','Calculate arithmetic and common scientific expressions.'],['math-problem-solver','ruler','Math Problem Solver','Solve arithmetic, percentages and simple linear equations.'],['citation-generator','book','Citation Generator','Generate APA, MLA or Chicago-style basic citations.'],['essay-outline-generator','pen','Essay Outline Generator','Create a clear essay structure from your topic.'],['quiz-generator','question','Quiz Generator','Create practice questions from notes.'],['notes-summarizer','file','Notes Summarizer','Make a concise local summary from notes.'],['grammar-checker','text','Grammar Checker','Detect common spacing, capitalization and punctuation issues.'],['student-translator','globe','Student Translator','Use the browser translation API when supported.'],['pdf-notes-extractor','file','PDF Study Notes Extractor','Extract text from a selectable PDF using the browser File API.'],['semester-result-calculator','chart','Semester Result Calculator','Calculate weighted GPA from credits and grade points.'],['exam-countdown','graduation','Exam Countdown','Set an exam date and see the remaining time.'],['student-budget-calculator','money','Student Budget Calculator','Compare monthly income with student expenses.'],['assignment-checklist','check','Assignment Checklist','Create, complete and remove tasks. Saved locally.'],['study-notes-organizer','folder','Study Notes Organizer','Store subject notes locally in your browser.']
];

function Icon({ name }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    file: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h5"/></>,
    scissors: <><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="m8 7 10 10M8 17 18 7"/></>,
    compress: <><path d="M7 3v5H3M17 3v5h4M7 21v-5H3M17 21v-5h4"/><path d="M8 8 5 5M16 8l3-3M8 16l-3 3M16 16l3 3"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></>,
    id: <><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M5.5 16c.8-2 6.2-2 7 0M15 9h3M15 12h3M15 15h2"/></>,
    graduation: <><path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5M21 9v6"/></>,
    bank: <><path d="m3 9 9-5 9 5M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18"/></>,
    money: <><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M7 9h.01M17 15h.01"/></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    invoice: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    qr: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/></>,
    code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>,
    tag: <><path d="M4 5v6l9 9 7-7-9-9H4Z"/><circle cx="8" cy="8" r="1"/></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></>,
    spark: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
    document: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h5"/></>,
    chart: <><path d="M4 19V5M4 19h16"/><path d="m7 15 3-4 3 2 5-6"/></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8 9h8M8 13h6M8 17h4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M12 13V9M9 3h6M12 5V3"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    calculator: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/></>,
    ruler: <><path d="m4 19 15-15 2 2L6 21H4v-2Z"/><path d="m9 14 2 2M12 11l2 2M15 8l2 2"/></>,
    book: <><path d="M4 5a3 3 0 0 1 3-2h13v17H7a3 3 0 0 0-3 3V5Z"/><path d="M7 20h13M8 7h8M8 11h6"/></>,
    pen: <><path d="m4 20 4.5-1 10-10a2 2 0 0 0-3-3l-10 10L4 20Z"/><path d="m14 7 3 3"/></>,
    brain: <><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3M9 4v16M15 4v16M9 10h6M9 15h6"/></>,
    question: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.4 1.9c-1.1 1-1.9 1.3-1.9 2.6M12 17h.01"/></>,
    text: <><path d="M5 5h14M9 5v14M7 19h4M13 19h4"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
    folder: <><path d="M3 7h7l2 2h9v10H3z"/><path d="M3 7V5h6l2 2"/></>,
  };
  return <span className="tool-icon">{paths[name] ? <svg {...common}>{paths[name]}</svg> : <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>}</span>;
}

function ToolGrid({ items, base }) {
  return <div className="grid">{items.map(([slug,icon,title,desc], i) => {
    const href = base === 'ai' ? (slug === 'ai' ? '/ai' : slug === 'cv-maker' ? '/cv-maker' : `/${slug}`) : `/${base}/${slug}`;
    return <Link className="card" href={href} key={`${slug}-${i}`}><span className="icon-wrap"><Icon name={icon}/></span><div><h3>{title}</h3><p>{desc}</p></div><span className="card-arrow" aria-hidden="true">→</span></Link>;
  })}</div>;
}

export default function Home() {
  return <>
    <main>
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-eyebrow"><span className="home-live-dot"/> YOUR EVERYDAY DIGITAL TOOLKIT</div>
          <h1>Get things done.<br/><span>Without the hassle.</span></h1>
          <p>Free online tools for everyday tasks, smarter studying and AI-powered help — all in one simple place.</p>
          <div className="home-hero-actions">
            <a className="btn home-primary" href="#tools">Explore all tools <span aria-hidden="true">↘</span></a>
            <Link className="home-secondary" href="/ai">Try AI Assistant <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="home-proof"><span><b>✓</b> Free tools</span><span><b>✓</b> Works on mobile</span><span><b>✓</b> No install needed</span></div>
        </div>
        <div className="home-hero-visual" aria-label="QuickToolBox collection of online tools">
          <div className="home-visual-glow"/>
          <div className="home-window">
            <div className="home-window-top"><div className="home-window-dots"><i/><i/><i/></div><span>quicktoolbox / workspace</span><span className="home-window-status">READY</span></div>
            <div className="home-window-body">
              <div className="home-window-greeting"><span className="home-avatar">Q</span><div><b>Your toolbox is ready.</b><small>What would you like to do today?</small></div></div>
              <Link href="/ai" className="home-feature-tile home-feature-ai"><span className="home-feature-icon">✦</span><span><b>AI Assistant</b><small>Write, explain and summarize</small></span><em>↗</em></Link>
              <Link href="/tools/pdf-merge" className="home-feature-tile"><span className="home-feature-icon home-feature-blue">▤</span><span><b>PDF tools</b><small>Merge, split and compress files</small></span><em>↗</em></Link>
              <Link href="/student-tools" className="home-feature-tile"><span className="home-feature-icon home-feature-orange">✎</span><span><b>Study smarter</b><small>Study helpers for students</small></span><em>↗</em></Link>
              <div className="home-window-foot"><span><i/> Simple to use</span><span>One place. Many possibilities.</span></div>
            </div>
          </div>
          <div className="home-float-note home-note-top"><span>⚡</span><div><b>Quick & simple</b><small>Start in seconds</small></div></div>
          <div className="home-float-note home-note-bottom"><span>◈</span><div><b>Made for everyday</b><small>Desktop + mobile</small></div></div>
        </div>
      </section>
      <section className="home-shortcuts" aria-label="Popular categories">
        <a href="#tools"><span className="shortcut-icon shortcut-purple">▤</span><span><b>Everyday tools</b><small>PDF, images, calculators</small></span><em>↗</em></a>
        <a href="#ai"><span className="shortcut-icon shortcut-blue">✦</span><span><b>AI & creativity</b><small>Writing, prompts and more</small></span><em>↗</em></a>
        <a href="#student-tools"><span className="shortcut-icon shortcut-green">✎</span><span><b>Student tools</b><small>Notes, quizzes, study plans</small></span><em>↗</em></a>
      </section>
      <ToolDiscovery tools={tools} aiTools={aiTools} studentTools={studentTools} />
      <section id="about" className="about"><small>WHY QUICKTOOLBOX?</small><h2>Fast, private and mobile-friendly.</h2><div className="features"><div>⚡ <b>Fast</b><p>Lightweight browser-first tools.</p></div><div>🔒 <b>Private</b><p>Local file tools process files in your browser.</p></div><div>📱 <b>Responsive</b><p>Designed for phones, tablets and computers.</p></div></div></section>
    </main>
    <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
  </>;
}
