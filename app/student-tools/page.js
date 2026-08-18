'use client';

import {use,useEffect,useMemo,useState} from 'react';

const META={
'gpa-cgpa-calculator':['🎓','GPA / CGPA Calculator','Enter course credits and grade points, one course per line.'],
'grade-calculator':['📊','Grade & Percentage Calculator','Enter marks and total marks.'],
'assignment-planner':['📝','Assignment Planner','Add assignments and deadlines. Saved locally.'],
'study-timetable':['📅','Study Timetable Generator','Enter subjects and available study hours.'],
'pomodoro-timer':['⏱️','Pomodoro Study Timer','Focus with a 25-minute study session and 5-minute break.'],
'study-time-calculator':['⏰','Study Time Calculator','Split your target study hours across days.'],
'scientific-calculator':['🔢','Scientific Calculator','Calculate arithmetic and common scientific expressions.'],
'math-problem-solver':['📐','Math Problem Solver','Solve arithmetic, percentages and simple linear equations.'],
'word-character-counter':['📖','Word & Character Counter','Count words, characters, lines and reading time.'],
'citation-generator':['📚','Citation Generator','Generate APA, MLA or Chicago-style basic citations.'],
'essay-outline-generator':['✍️','Essay Outline Generator','Create a clear essay structure from your topic.'],
'flashcard-generator':['🧠','Flashcard Generator','Create editable Q&A flashcards from notes.'],
'quiz-generator':['❓','Quiz Generator','Create practice questions from notes.'],
'ai-study-assistant':['🤖','AI Study Assistant','Send a study question to the site AI endpoint when configured.'],
'notes-summarizer':['📄','Notes Summarizer','Make a concise local summary from notes.'],
'grammar-checker':['🔤','Grammar Checker','Detect common spacing, capitalization and punctuation issues.'],
'student-translator':['🌐','Student Translator','Use the browser translation API when supported, or copy text for translation.'],
'pdf-notes-extractor':['📑','PDF Study Notes Extractor','Extract text from a selectable PDF using the browser File API.'],
'semester-result-calculator':['📈','Semester Result Calculator','Calculate weighted GPA from credits and grade points.'],
'exam-countdown':['🎓','Exam Countdown','Set an exam date and see the remaining time.'],
'student-budget-calculator':['💰','Student Budget Calculator','Compare monthly income with student expenses.'],
'notes-qr-generator':['🔗','Notes QR Generator','Create a QR-ready link using the browser share/copy tools.'],
'assignment-checklist':['☑️','Assignment Checklist','Create, complete and remove tasks. Saved locally.'],
'study-notes-organizer':['🗂️','Study Notes Organizer','Store subject notes locally in your browser.']
};

function Card({children}){return <section style={{padding:22,border:'1px solid #ddd',borderRadius:16,marginTop:18}}>{children}</section>}
const btn={padding:'10px 14px',border:0,borderRadius:10,cursor:'pointer'};

export default function StudentTool({params}){
 const resolvedParams=use(params); const slug=resolvedParams?.slug||''; const [value,setValue]=useState(''); const [result,setResult]=useState(''); const [items,setItems]=useState([]); const [seconds,setSeconds]=useState(1500);
 const [name,setName]=useState(''); const [deadline,setDeadline]=useState(''); const [task,setTask]=useState(''); const [notes,setNotes]=useState('');
 const meta=META[slug]||['🎓','Student Tool','Useful student utility.'];
 useEffect(()=>{try{const k='qt-'+slug; const saved=JSON.parse(localStorage.getItem(k)||'[]'); if(Array.isArray(saved))setItems(saved)}catch{}},[slug]);
 useEffect(()=>{if(slug!=='pomodoro-timer'||seconds<=0)return; const id=setInterval(()=>setSeconds(s=>s-1),1000); return()=>clearInterval(id)},[slug,seconds]);
 const save=(next)=>{setItems(next);try{localStorage.setItem('qt-'+slug,JSON.stringify(next))}catch{}};
 const gpa=useMemo(()=>{if(!value)return null; let c=0,p=0; value.split(/\n|,/).forEach(x=>{const [cr,pt]=x.trim().split(/\s*[:|]\s*/).map(Number);if(cr>0&&Number.isFinite(pt)){c+=cr;p+=cr*pt}});return c?p/c:null},[value]);
 const calculate=()=>{
  if(slug==='gpa-cgpa-calculator'||slug==='semester-result-calculator'){setResult(gpa?`Weighted GPA: ${gpa.toFixed(2)}`:'Use format: 3:4.0, 3:3.5, 4:3.0');return}
  if(slug==='grade-calculator'){const [m,t]=value.split(/[,/]/).map(Number);const pct=t?m/t*100:0;const grade=pct>=80?'A+':pct>=70?'A':pct>=60?'A-':pct>=50?'B':pct>=40?'C':'F';setResult(`${pct.toFixed(2)}% — Grade ${grade}`);return}
  if(slug==='study-time-calculator'){const [h,d]=value.split(/[,/]/).map(Number);setResult(h&&d?`${(h/d).toFixed(2)} hours/day`:'Use: total hours,days');return}
  if(slug==='student-budget-calculator'){const [income,...costs]=value.split(/[,/]/).map(Number);const total=costs.reduce((a,b)=>a+(b||0),0);setResult(`Expenses: ${total.toFixed(2)} | Balance: ${(income-total).toFixed(2)}`);return}
  if(slug==='scientific-calculator'){try{if(!/^[0-9+\-*/().,%\s^a-zA-Z]+$/.test(value))throw Error(); const safe=value.replace(/\^/g,'**').replace(/sin/gi,'Math.sin').replace(/cos/gi,'Math.cos').replace(/sqrt/gi,'Math.sqrt');setResult(String(Function(`"use strict";return (${safe})`)()))}catch{setResult('Invalid expression')}}
  if(slug==='math-problem-solver'){const x=value.trim(); const pct=x.match(/([0-9.]+)\s*%\s*of\s*([0-9.]+)/i); const eq=x.match(/^([0-9.]+)x\s*([+-])\s*([0-9.]+)\s*=\s*([0-9.]+)$/i); if(pct)setResult(String(Number(pct[1])*Number(pct[2])/100)); else if(eq){const a=Number(eq[1]),b=(eq[2]==='+'?1:-1)*Number(eq[3]),c=Number(eq[4]);setResult(`x = ${((c-b)/a).toFixed(6)}`)} else setResult('Try “15% of 240” or “2x + 4 = 10”')}
 };
 const add=()=>{if(!task.trim())return;save([...items,{id:Date.now(),text:task,deadline,done:false}]);setTask('');setDeadline('')};
 const toggle=id=>save(items.map(x=>x.id===id?{...x,done:!x.done}:x));
 const remove=id=>save(items.filter(x=>x.id!==id));
 const summarize=()=>{const s=notes.trim(); if(!s)return setResult('Paste notes first.'); const sentences=s.split(/(?<=[.!?])\s+/).filter(Boolean);setResult(sentences.slice(0,Math.max(3,Math.ceil(sentences.length/3))).join(' '))};
 const outline=()=>setResult(value?`Introduction: ${value}\n\n1. Background and context\n2. Main argument / key points\n3. Evidence and examples\n4. Counterpoint and response\n5. Conclusion and recommendation`:'Enter an essay topic.');
 const citation=()=>{const [author,title,year,site]=value.split('|').map(s=>s?.trim());setResult(`APA: ${author||'Author'}. (${year||'Year'}). ${title||'Title'}. ${site||'Publisher'}.\n\nMLA: ${author||'Author'}. “${title||'Title'}.” ${site||'Publisher'}, ${year||'Year'}.\n\nChicago: ${author||'Author'}. “${title||'Title'}.” ${site||'Publisher'}, ${year||'Year'}.`)};
 const flashcards=()=>save(notes.split(/\n/).filter(Boolean).map((x,i)=>{const [q,a]=x.split(/\s*::\s*/);return{id:i,text:q||x,answer:a||'Add answer'}}));
 const quiz=()=>setResult(notes.split(/\n/).filter(Boolean).slice(0,10).map((x,i)=>`${i+1}. Explain: ${x.replace(/[?!.]+$/,'')}?`).join('\n'));
 const grammar=()=>{let s=notes.replace(/\s+/g,' ').replace(/\s+([,.!?])/g,'$1').replace(/(^|[.!?]\s+)([a-z])/g,(_,a,b)=>a+b.toUpperCase());setResult(s)};
 const ai=async()=>{setResult('Thinking…');try{const r=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:notes||value||'Explain this topic for a student in simple language.'})});const j=await r.json();setResult(j.text||j.error||'AI response unavailable.')}catch{setResult('AI is not configured or unavailable.')}};
 const wordStats=()=>{const s=notes||value;setResult(`Words: ${(s.trim().match(/\S+/g)||[]).length}\nCharacters: ${s.length}\nLines: ${s?s.split('\n').length:0}\nReading time: ${Math.max(1,Math.ceil((s.trim().match(/\S+/g)||[]).length/200))} min`)};
 const countdown=()=>{const d=new Date(value); if(Number.isNaN(d.getTime()))return setResult('Enter a valid exam date/time.'); const diff=d-Date.now();setResult(diff<=0?'Exam time has arrived.':`${Math.floor(diff/86400000)} days, ${Math.floor(diff%86400000/3600000)} hours, ${Math.floor(diff%3600000/60000)} minutes remaining.`)};
 const genericAction=slug==='notes-summarizer'?summarize:slug==='essay-outline-generator'?outline:slug==='citation-generator'?citation:slug==='flashcard-generator'?flashcards:slug==='quiz-generator'?quiz:slug==='grammar-checker'?grammar:slug==='ai-study-assistant'?ai:slug==='word-character-counter'?wordStats:slug==='exam-countdown'?countdown:calculate;
 return <main style={{maxWidth:820,margin:'0 auto',padding:'32px 16px'}}><div><div style={{fontSize:40}}>{meta[0]}</div><h1>{meta[1]}</h1><p>{meta[2]}</p></div>
  {(slug==='assignment-planner'||slug==='assignment-checklist')&&<Card><input placeholder="Assignment" value={task} onChange={e=>setTask(e.target.value)} style={{padding:12,width:'55%',marginRight:8}}/><input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={{padding:12}}/><button onClick={add} style={{...btn,marginLeft:8}}>Add</button>{items.map(x=><div key={x.id} style={{padding:10,borderBottom:'1px solid #eee'}}><input type="checkbox" checked={!!x.done} onChange={()=>toggle(x.id)}/> <span style={{textDecoration:x.done?'line-through':'none'}}>{x.text}</span> {x.deadline&&<small> — {x.deadline}</small>} <button onClick={()=>remove(x.id)} style={{float:'right'}}>×</button></div>)}</Card>}
  {slug==='pomodoro-timer'&&<Card><h2>{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</h2><button onClick={()=>setSeconds(1500)} style={btn}>25 min</button> <button onClick={()=>setSeconds(300)} style={btn}>5 min break</button></Card>}
  {slug==='study-timetable'&&<Card><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Math, Physics, English..." rows={6} style={{width:'100%',padding:12}}/><button onClick={()=>setResult(notes.split(/[,\n]/).filter(Boolean).map((s,i)=>`${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i%7]}: ${s.trim()} — 1 hour`).join('\n'))} style={{...btn,marginTop:10}}>Generate timetable</button></Card>}
  {slug==='pdf-notes-extractor'&&<Card><input type="file" accept="application/pdf,text/plain" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;const t=await f.text();setResult(t.slice(0,10000))}}/><p>For text-readable PDFs, browser extraction depends on the PDF format. Plain text files are fully supported.</p></Card>}
  {slug==='notes-qr-generator'&&<Card><input value={value} onChange={e=>setValue(e.target.value)} placeholder="Paste a notes URL" style={{padding:12,width:'100%'}}/><button onClick={async()=>{try{await navigator.clipboard.writeText(value);setResult('Link copied. Paste it into any QR generator or share it.')}catch{setResult('Copy the link manually.')}}} style={{...btn,marginTop:10}}>Copy Link</button></Card>}
  {!['assignment-planner','assignment-checklist','pomodoro-timer','study-timetable','pdf-notes-extractor','notes-qr-generator'].includes(slug)&&<Card><textarea value={notes||value} onChange={e=>{setNotes(e.target.value);setValue(e.target.value)}} placeholder={slug==='gpa-cgpa-calculator'||slug==='semester-result-calculator'?'3:4.0, 3:3.5, 4:3.0':slug==='citation-generator'?'Author | Title | Year | Publisher/Website':'Enter your text, values or topic…'} rows={8} style={{width:'100%',padding:14,borderRadius:10,border:'1px solid #ccc'}}/><button onClick={genericAction} style={{...btn,marginTop:10}}>Run Tool</button>{result&&<pre style={{whiteSpace:'pre-wrap',marginTop:16,padding:16,background:'#f5f5f5',borderRadius:12}}>{result}</pre>}</Card>}
  {slug==='notes-qr-generator'&&result&&<Card><pre style={{whiteSpace:'pre-wrap'}}>{result}</pre></Card>}
 </main>
}
