'use client';
import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { evaluateSafeMath } from '../../../lib/safe-math.js';

const TOOLS = {
'grade-calculator':['📊','Grade & Percentage Calculator','Calculate percentage and grade from obtained marks.'],
'gpa-cgpa-calculator':['🎓','GPA / CGPA Calculator','Calculate credit-weighted GPA from course results.'],
'semester-result-calculator':['📈','Semester Result Calculator','Calculate your weighted semester GPA.'],
'study-timetable':['📅','Study Timetable Generator','Create a simple weekly plan from your subjects.'],
'study-time-calculator':['⏰','Study Time Calculator','Divide total study hours into a daily target.'],
'scientific-calculator':['🔢','Scientific Calculator','Evaluate arithmetic and supported scientific expressions.'],
'math-problem-solver':['📐','Math Problem Solver','Solve percentages and basic linear equations.'],
'word-character-counter':['🔤','Word & Character Counter','Count words, characters, lines and reading time.'],
'citation-generator':['📚','Citation Generator','Format a basic reference in APA, MLA and Chicago styles.'],
'essay-outline-generator':['✍️','Essay Outline Generator','Build a clear outline around your essay topic.'],
'quiz-generator':['❓','Quiz Generator','Turn notes into revision questions.'],
'notes-summarizer':['📄','Notes Summarizer','Create a short extractive summary from your notes.'],
'grammar-checker':['📝','Grammar Checker','Clean common spacing, capitalization and punctuation issues.'],
'student-translator':['🌐','Student Translator','Translate text using the configured AI service, when available.'],
'pdf-notes-extractor':['📑','PDF Study Notes Extractor','Extract selectable text from a PDF in your browser.'],
'exam-countdown':['🎯','Exam Countdown','Calculate the time remaining until your exam.'],
'student-budget-calculator':['💰','Student Budget Calculator','Calculate monthly expenses and remaining balance.'],
'assignment-checklist':['☑️','Assignment Checklist','Save assignments, due dates and completion status on this device.'],
'study-notes-organizer':['🗂️','Study Notes Organizer','Save and organize notes by subject.']
};
const field={width:'100%',minWidth:0,padding:'13px 14px',border:'1px solid #34415f',borderRadius:12,background:'#0b1224',color:'#f5f7ff',font:'inherit'};
const button={border:0,borderRadius:12,padding:'12px 18px',background:'linear-gradient(110deg,#7655ef,#287fca)',color:'#fff',fontWeight:750,cursor:'pointer'};
function Field({label,children}){return <label className="qt-st-field"><span>{label}</span>{children}</label>}
function Text({value,onChange,placeholder,rows=6}){return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{...field,resize:'vertical'}}/>}
function In({value,onChange,placeholder,type='text'}){return <input value={value} onChange={onChange} placeholder={placeholder} type={type} style={field}/>}
export default function StudentTool({params}){
 const {slug}=use(params); const meta=TOOLS[slug]; if(!meta)notFound();
 const [v,setV]=useState({obtained:'',total:'',text:'',hours:'',days:'7',expression:'',income:'',expenses:'',date:'',author:'',title:'',year:'',publisher:'',topic:'',target:'Bengali',subject:'',noteTitle:'',task:'',due:''});
 const [result,setResult]=useState(''),[error,setError]=useState(''),[items,setItems]=useState([]),[busy,setBusy]=useState(false),[pdfBusy,setPdfBusy]=useState(false);
 const change=k=>e=>setV(s=>({...s,[k]:e.target.value}));
 const out=s=>{setError('');setResult(s)}, bad=s=>{setResult('');setError(s)};
 useEffect(()=>{if(!['assignment-checklist','study-notes-organizer'].includes(slug))return;try{const x=JSON.parse(localStorage.getItem('qt-'+slug)||'[]');if(Array.isArray(x))setItems(x)}catch{}},[slug]);
 const save=next=>{setItems(next);try{localStorage.setItem('qt-'+slug,JSON.stringify(next))}catch{bad('Browser storage unavailable or full. Export your notes before clearing browser data.')}};
 const lines=v.text.split(/\n|,/).map(x=>x.trim()).filter(Boolean);
 function run(){try{
 if(slug==='grade-calculator'){const m=Number(v.obtained),t=Number(v.total);if(!v.obtained||!v.total||!Number.isFinite(m+t)||t<=0||m<0||m>t)throw Error('Obtained marks must be between zero and full marks.');const p=m/t*100,g=p>=80?'A+':p>=70?'A':p>=60?'A-':p>=50?'B':p>=40?'C':'F';out('Percentage: '+p.toFixed(2)+'%\nGrade: '+g);}
 else if(['gpa-cgpa-calculator','semester-result-calculator'].includes(slug)){const rows=v.text.split(/\n|,/).filter(Boolean).map(x=>x.trim().split(/[:|]/).map(Number));if(!rows.length||rows.some(([c,p])=>!Number.isFinite(c+p)||c<=0||p<0||p>4))throw Error('Enter each course as credit:grade point (example 3:3.75). Grade points must be 0–4.');const c=rows.reduce((s,x)=>s+x[0],0),g=rows.reduce((s,x)=>s+x[0]*x[1],0)/c;out('Total credits: '+c.toFixed(2)+'\nWeighted GPA: '+g.toFixed(2)+' / 4.00');}
 else if(slug==='study-time-calculator'){const h=Number(v.hours),d=Number(v.days);if(!v.hours||!v.days||!Number.isFinite(h+d)||h<=0||d<=0)throw Error('Enter positive total hours and number of days.');out('Daily target: '+(h/d).toFixed(2)+' hours ('+(h*60/d).toFixed(0)+' minutes).');}
 else if(slug==='scientific-calculator'){if(!v.expression.trim())throw Error('Enter an expression.');out('Result: '+evaluateSafeMath(v.expression));}
 else if(slug==='math-problem-solver'){const p=v.expression.trim().match(/^(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)$/i),e=v.expression.trim().match(/^(-?\d+(?:\.\d+)?)\s*x\s*([+-])\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)$/i);if(p)out(Number(p[1])*Number(p[2])/100+'');else if(e&&Number(e[1])!==0){const b=(e[2]==='+'?1:-1)*Number(e[3]);out('x = '+((Number(e[4])-b)/Number(e[1])).toFixed(6));}else throw Error('Try “15% of 240” or “2x + 4 = 10”.');}
 else if(slug==='word-character-counter'){const n=v.text.trim()?v.text.trim().split(/\s+/).length:0;out('Words: '+n+'\nCharacters: '+v.text.length+'\nCharacters without spaces: '+v.text.replace(/\s/g,'').length+'\nLines: '+(v.text?v.text.split('\n').length:0)+'\nReading time: '+Math.max(1,Math.ceil(n/200))+' min');}
 else if(slug==='study-timetable'){if(!lines.length)throw Error('Enter subjects separated by commas or new lines.');out(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d,i)=>d+'\n  '+lines[i%lines.length]+' — 1 hour').join('\n\n'));}
 else if(slug==='student-budget-calculator'){const income=Number(v.income),costs=v.expenses.split(',').map(Number);if(!v.income||!v.expenses.trim()||!Number.isFinite(income)||income<0||costs.some(x=>!Number.isFinite(x)||x<0))throw Error('Enter monthly income and comma-separated non-negative expenses in BDT.');const total=costs.reduce((a,b)=>a+b,0),balance=income-total;out('Income: ৳'+income.toFixed(2)+'\nExpenses: ৳'+total.toFixed(2)+'\n'+(balance>=0?'Remaining balance: ':'Budget deficit: ')+'৳'+Math.abs(balance).toFixed(2));}
 else if(slug==='exam-countdown'){if(!v.date)throw Error('Choose exam date and time.');const diff=new Date(v.date).getTime()-Date.now();if(!Number.isFinite(diff))throw Error('Choose a valid date.');out(diff<=0?'Exam time has arrived or passed.':Math.floor(diff/86400000)+' days, '+Math.floor(diff%86400000/3600000)+' hours and '+Math.floor(diff%3600000/60000)+' minutes remaining.');}
 else if(slug==='citation-generator'){if(!v.author.trim()||!v.title.trim()||!v.year.trim())throw Error('Author, title and year are required.');out('APA 7\n'+v.author+'. ('+v.year+'). '+v.title+'. '+v.publisher+'.\n\nMLA 9\n'+v.author+'. "'+v.title+'." '+v.publisher+', '+v.year+'.\n\nChicago\n'+v.author+'. "'+v.title+'." '+v.publisher+', '+v.year+'.');}
 else if(slug==='essay-outline-generator'){if(!v.topic.trim())throw Error('Enter an essay topic.');out('Topic: '+v.topic+'\n\n1. Introduction\n   • Background and context\n   • Thesis statement\n\n2. Main body\n   • Key point 1 with evidence\n   • Key point 2 with evidence\n   • Key point 3 with evidence\n\n3. Counterargument and response\n\n4. Conclusion and final thought');}
 else if(slug==='quiz-generator'){if(!lines.length)throw Error('Enter one fact or topic per line.');out(lines.slice(0,20).map((x,i)=>(i+1)+'. Explain: '+x.replace(/[?.!]+$/,'')+'?').join('\n'));}
 else if(slug==='notes-summarizer'){if(!v.text.trim())throw Error('Paste notes first.');const s=v.text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);out('Extractive summary (opening sentences):\n\n'+s.slice(0,Math.max(1,Math.ceil(s.length/3))).join(' '));}
 else if(slug==='grammar-checker'){if(!v.text.trim())throw Error('Paste text first.');out('Basic text cleanup (not a full grammar proofread):\n\n'+v.text.replace(/[ \t]+/g,' ').replace(/\s+([,.!?;:])/g,'$1').replace(/([,.!?])(?=[A-Za-z])/g,'$1 ').replace(/(^|[.!?]\s+)([a-z])/g,(_,a,b)=>a+b.toUpperCase()));}
 }catch(e){bad(e.message||'Invalid input. Check your values.');}}
 async function translate(){if(!v.text.trim())return bad('Enter text to translate.');setBusy(true);try{const r=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:'Translate into '+v.target+'. Preserve meaning and formatting. Return only translation.\n\n'+v.text})});const j=await r.json();if(!r.ok||j.error||!j.text)throw Error(j.error||'AI provider returned no translation.');out(j.text);}catch(e){bad(e.message||'Translation failed.');}finally{setBusy(false);}}
 async function extract(e){const f=e.target.files?.[0];if(!f)return;if(f.size>25*1024*1024)return bad('Maximum PDF size is 25 MB.');setPdfBusy(true);try{let pdf=window.pdfjsLib;if(!pdf){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=resolve;s.onerror=()=>reject(Error('Could not load PDF.js.'));document.head.appendChild(s)});pdf=window.pdfjsLib;}if(!pdf)throw Error('PDF.js unavailable.');pdf.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const doc=await pdf.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise;if(doc.numPages>100)throw Error('Maximum 100 pages.');let text='';for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i),c=await p.getTextContent();text+='\n\n--- Page '+i+' ---\n'+c.items.map(x=>x.str).join(' ');}out(text.trim()||'No selectable text found. Scanned PDFs need OCR, which is not included.');}catch(err){bad(err.message||'PDF extraction failed.');}finally{setPdfBusy(false);}}
 const addTask=()=>{if(!v.task.trim())return bad('Enter an assignment title.');save([...items,{id:Date.now(),title:v.task,due:v.due,done:false}]);setV(s=>({...s,task:'',due:''}));out('Assignment saved in this browser.');};
 const inp=(k,p,t)=> <In value={v[k]} onChange={change(k)} placeholder={p} type={t||'text'}/>;
 const txt=(p,r)=> <Text value={v.text} onChange={change('text')} placeholder={p} rows={r||6}/>;
 return <main className="qt-student-tool">
 <nav className="qt-student-breadcrumb"><a href="/student-tools">Student Tools</a><span>/</span><span>{meta[1]}</span></nav>
 <section className="qt-student-heading"><span className="qt-student-icon">{meta[0]}</span><div><p className="qt-student-kicker">QUICKTOOLBOX / STUDENT STUDIO</p><h1>{meta[1]}</h1><p className="qt-student-description">{meta[2]}</p></div></section>
 <section className="qt-student-panel">
 {slug==='grade-calculator'&&<div className="qt-student-fields two"><Field label="Obtained marks">{inp('obtained','e.g. 425','number')}</Field><Field label="Full marks">{inp('total','e.g. 500','number')}</Field></div>}
 {['gpa-cgpa-calculator','semester-result-calculator'].includes(slug)&&<Field label="Course credits and grade points (one per line, credit:point)">{txt('3:3.75\n3:3.50\n4:4.00')}<small>Weighted GPA uses a 4.00 scale. Confirm your institution’s grading rules.</small></Field>}
 {slug==='study-time-calculator'&&<div className="qt-student-fields two"><Field label="Total study hours">{inp('hours','e.g. 42','number')}</Field><Field label="Number of days">{inp('days','e.g. 7','number')}</Field></div>}
 {slug==='scientific-calculator'&&<Field label="Expression">{inp('expression','sqrt(81) + 2^3')}</Field>}
 {slug==='math-problem-solver'&&<Field label="Math problem">{inp('expression','15% of 240 or 2x + 4 = 10')}</Field>}
 {slug==='word-character-counter'&&<Field label="Your text">{txt('Paste or type text here…')}</Field>}
 {slug==='study-timetable'&&<Field label="Subjects (comma or new-line separated)">{txt('Mathematics, Physics, English…',5)}</Field>}
 {slug==='student-budget-calculator'&&<div className="qt-student-fields two"><Field label="Monthly income (BDT)">{inp('income','e.g. 12000','number')}</Field><Field label="Expenses (comma-separated BDT)">{inp('expenses','3000, 1500, 800')}</Field></div>}
 {slug==='exam-countdown'&&<Field label="Exam date and time">{inp('date','','datetime-local')}</Field>}
 {slug==='citation-generator'&&<div className="qt-student-fields"><Field label="Author">{inp('author','Author name')}</Field><Field label="Title">{inp('title','Book or article title')}</Field><Field label="Year">{inp('year','2026','number')}</Field><Field label="Publisher / Website (optional)">{inp('publisher','Publisher or website')}</Field></div>}
 {slug==='essay-outline-generator'&&<Field label="Essay topic">{inp('topic','The importance of technical education')}</Field>}
 {slug==='quiz-generator'&&<Field label="Study facts or topics (one per line)">{txt('One fact or topic per line…')}</Field>}
 {slug==='notes-summarizer'&&<Field label="Study notes">{txt('Paste your notes here…')}</Field>}
 {slug==='grammar-checker'&&<Field label="Text to clean up">{txt('Paste your text here…')}</Field>}
 {slug==='student-translator'&&<><Field label="Translate to language">{inp('target','Bengali')}</Field><Field label="Text to translate">{txt('Enter text to translate…')}</Field></>}
 {slug==='pdf-notes-extractor'&&<Field label="PDF file (max 25 MB, 100 pages)"><In type="file" onChange={extract}/><small>Extracts selectable text only. Scanned PDFs need OCR.</small></Field>}
 {slug==='assignment-checklist'&&<><div className="qt-student-fields two"><Field label="Assignment title">{inp('task','Submit physics lab report')}</Field><Field label="Due date">{inp('due','','date')}</Field></div><button style={button} onClick={addTask}>Add assignment</button><div className="qt-student-items">{items.length?items.map(x=><article key={x.id}><label><input type="checkbox" checked={x.done} onChange={()=>save(items.map(y=>y.id===x.id?{...y,done:!y.done}:y))}/><span className={x.done?'is-done':''}>{x.title}</span></label><small>{x.due||'No due date'}</small><button onClick={()=>save(items.filter(y=>y.id!==x.id))}>Delete</button></article>):<p>No assignments yet.</p>}</div></>}
 {slug==='study-notes-organizer'&&<><div className="qt-student-fields two"><Field label="Subject">{inp('subject','Physics')}</Field><Field label="Note title">{inp('noteTitle','Newton laws')}</Field></div><Field label="Note content">{txt('Write or paste your notes…')}</Field><button style={button} onClick={()=>{if(!v.noteTitle.trim()||!v.text.trim())return bad('Enter a note title and content.');save([...items,{id:Date.now(),subject:v.subject||'General',title:v.noteTitle,text:v.text}]);setV(s=>({...s,noteTitle:'',text:''}));out('Note saved in this browser.');}}>Save note</button><div className="qt-student-items">{items.map(x=><article key={x.id}><div><strong>{x.title}</strong><small>{x.subject}</small><p>{x.text}</p></div><button onClick={()=>setV(s=>({...s,subject:x.subject,noteTitle:x.title,text:x.text}))}>Load</button><button onClick={()=>save(items.filter(y=>y.id!==x.id))}>Delete</button></article>)}</div></>}
 {['grade-calculator','gpa-cgpa-calculator','semester-result-calculator','study-time-calculator','scientific-calculator','math-problem-solver','word-character-counter','study-timetable','student-budget-calculator','exam-countdown','citation-generator','essay-outline-generator','quiz-generator','notes-summarizer','grammar-checker'].includes(slug)&&<button style={button} onClick={run}>Run Tool</button>}
 {slug==='student-translator'&&<button style={button} disabled={busy} onClick={translate}>{busy?'Translating…':'Translate'}</button>}
 {slug==='pdf-notes-extractor'&&pdfBusy&&<p className="qt-student-muted">Extracting PDF text…</p>}
 {error&&<div className="qt-student-error" role="alert">{error}</div>}
 {result&&<div className="qt-student-result" aria-live="polite"><strong>Result</strong><pre>{result}</pre><button onClick={()=>navigator.clipboard?.writeText(result)}>Copy result</button></div>}
 </section><p className="qt-student-privacy">Lists and notes are stored in this browser. Translation needs a configured AI provider. Check official institutional rules before relying on grade calculations.</p>
 </main>;
}
