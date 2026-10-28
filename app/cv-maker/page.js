'use client';
import {useMemo,useRef,useState} from 'react';

const palette = [
  {name:'Ocean',value:'#2563eb'}, {name:'Violet',value:'#7c3aed'}, {name:'Emerald',value:'#059669'},
  {name:'Rose',value:'#e11d48'}, {name:'Amber',value:'#d97706'}, {name:'Ink',value:'#334155'}
];
const templates = [
  {id:'modern',name:'Modern',label:'Clean & balanced',layout:'modern',color:'#2563eb'},
  {id:'minimal',name:'Minimal',label:'Simple & readable',layout:'minimal',color:'#334155'},
  {id:'sidebar',name:'Sidebar',label:'Skills on the side',layout:'sidebar',color:'#7c3aed'},
  {id:'executive',name:'Executive',label:'Confident & polished',layout:'executive',color:'#0f766e'},
  {id:'creative',name:'Creative',label:'Bold accent blocks',layout:'creative',color:'#e11d48'},
  {id:'classic',name:'Classic',label:'Traditional CV',layout:'classic',color:'#1d4ed8'},
  {id:'elegant',name:'Elegant',label:'Editorial & refined',layout:'elegant',color:'#a16207'},
  {id:'compact',name:'Compact',label:'More room for details',layout:'compact',color:'#475569'},
  {id:'academic',name:'Academic',label:'Education first',layout:'academic',color:'#0369a1'},
  {id:'corporate',name:'Corporate',label:'Professional & formal',layout:'corporate',color:'#155e75'},
  {id:'timeline',name:'Timeline',label:'Career journey',layout:'timeline',color:'#9333ea'},
  {id:'bold',name:'Bold',label:'Strong visual hierarchy',layout:'bold',color:'#be123c'}
];
const defaults = {
  name:'YOUR NAME', role:'Professional Title', email:'you@example.com', phone:'+880 1XXXXXXXXX',
  location:'Rangpur, Bangladesh',
  summary:'Motivated professional with strong communication, technical and problem-solving skills. Ready to contribute to a growth-focused organization.',
  skills:'Communication • Microsoft Office • Teamwork • Problem Solving • Leadership',
  experience:'Job Title — Company Name — 2024–Present\n• Managed daily responsibilities and improved team workflow.\n• Worked with clients and colleagues to deliver quality results.',
  education:'Degree / Diploma — Institute Name — 2024\nCGPA / Result: 3.50 / 4.00',
  certificates:'Professional Certificate — Issuing Organization — 2024', languages:'Bangla • English'
};
const groups = {
  'Personal': ['name','role','email','phone','location'],
  'Profile': ['summary'],
  'Experience': ['experience'],
  'Education': ['education'],
  'Skills': ['skills','languages'],
  'Certificates': ['certificates']
};
const labels = {name:'Full name',role:'Professional title',email:'Email address',phone:'Phone number',location:'Location',summary:'Professional summary',experience:'Work experience',education:'Education',skills:'Skills',certificates:'Certificates',languages:'Languages'};
function Field({name,form,setForm}) {
  const multiline = ['summary','experience','education','skills','certificates'].includes(name);
  return <label className="cv-studio-field"><span>{labels[name]}</span>{multiline
    ? <textarea rows={name==='experience'?6:4} value={form[name]} onChange={e=>setForm(p=>({...p,[name]:e.target.value}))} />
    : <input value={form[name]} onChange={e=>setForm(p=>({...p,[name]:e.target.value}))} />}</label>;
}
function PhotoControl({photo,setPhoto}) {
  const input = useRef(null);
  function choose(e) { const file=e.target.files?.[0]; if(!file || !file.type.startsWith('image/')) return; const reader=new FileReader(); reader.onload=()=>setPhoto(String(reader.result)); reader.readAsDataURL(file); }
  return <div className="cv-photo-control"><div className="cv-photo-thumb">{photo?<img src={photo} alt="Profile preview"/>:<span>+</span>}</div><div><b>Profile photo</b><p>Add a professional headshot</p><input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={choose}/><button type="button" className="cv-secondary-btn" onClick={()=>input.current?.click()}>{photo?'Change photo':'Upload photo'}</button>{photo&&<button type="button" className="cv-text-btn" onClick={()=>{setPhoto('');if(input.current)input.current.value=''}}>Remove</button>}</div></div>;
}
function CvPreview({form,template,photo,accent,font}) {
  return <article className={'cv-paper cv-'+template.layout+' cv-'+accent} style={{'--cv-accent':accent,'--cv-font':font}}>
    <div className="cv-top">{photo&&<img className="cv-photo" src={photo} alt="Profile"/>}<div><h1>{form.name||'YOUR NAME'}</h1><h2>{form.role||'Professional Title'}</h2><p>{[form.email,form.phone,form.location].filter(Boolean).join('  •  ')}</p></div></div>
    <div className="cv-body"><aside><section className="cv-section"><h3>CONTACT</h3>{[form.email,form.phone,form.location].filter(Boolean).map((v,i)=><p key={i}>{v}</p>)}</section><section className="cv-section"><h3>SKILLS</h3><p className="pre">{form.skills}</p></section><section className="cv-section"><h3>LANGUAGES</h3><p className="pre">{form.languages}</p></section></aside>
      <div className="cv-main"><section className="cv-section"><h3>PROFILE</h3><p className="pre">{form.summary}</p></section><section className="cv-section"><h3>EXPERIENCE</h3><p className="pre">{form.experience}</p></section><section className="cv-section"><h3>EDUCATION</h3><p className="pre">{form.education}</p></section><section className="cv-section"><h3>CERTIFICATES</h3><p className="pre">{form.certificates}</p></section></div></div>
  </article>;
}
export default function CVMaker() {
  const [form,setForm]=useState(defaults);
  const [photo,setPhoto]=useState('');
  const [templateId,setTemplateId]=useState('modern');
  const [activeTab,setActiveTab]=useState('Personal');
  const [accent,setAccent]=useState('#2563eb');
  const [font,setFont]=useState('Inter, Arial, sans-serif');
  const [search,setSearch]=useState('');
  const [aiBusy,setAiBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [zoom,setZoom]=useState(85);
  const template=templates.find(t=>t.id===templateId)||templates[0];
  const filtered=useMemo(()=>templates.filter(t=>(t.name+' '+t.label).toLowerCase().includes(search.toLowerCase())),[search]);
  function printCV(){window.print();}
  async function improveSummary(){
    setAiBusy(true);setNotice('');
    try{
      const prompt='Rewrite this candidate CV summary in a concise, professional and truthful way. Do not invent achievements. Candidate: '+form.name+'; role: '+form.role+'; draft: '+form.summary+'; skills: '+form.skills+'; experience: '+form.experience;
      const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'AI request failed');
      if(data.text){setForm(p=>({...p,summary:data.text}));setNotice(data.source==='local'?'Improved with the built-in assistant.':'Summary improved with AI.');}
      else setNotice('No text returned. Please try again.');
    }catch(e){setNotice(e.message||'Could not improve the summary. Please try again.');}
    finally{setAiBusy(false);}
  }
  return <>
    <header className="cv-studio-header"><a className="brand" href="/"><b>Q</b> QuickToolBox</a><div className="cv-studio-header-actions"><a href="/">All tools</a><span className="cv-save-status"><i/> Auto-updating preview</span><button className="cv-export-btn" onClick={printCV}>↓ Download PDF</button></div></header>
    <main className="cv-studio">
      <div className="cv-studio-title"><div><span className="cv-eyebrow">RESUME STUDIO</span><h1>Make a CV that gets noticed.</h1><p>Choose a design, add your details, and export a polished CV — free.</p></div><div className="cv-progress"><span>YOUR CV</span><b>{Math.min(100,Math.round(Object.values(form).filter(v=>String(v).trim() && !String(v).includes('YOUR NAME') && !String(v).includes('you@example.com') && !String(v).includes('Professional Title')).length/10*100))}% complete</b><div><i style={{width:Math.min(100,Math.round(Object.values(form).filter(v=>String(v).trim()).length/10*100))+'%'}}/></div></div></div>
      <div className="cv-studio-workspace">
        <aside className="cv-studio-sidebar">
          <div className="cv-studio-tabs">{['Personal','Profile','Experience','Education','Skills','Certificates','Design'].map((tab,i)=><button key={tab} className={activeTab===tab?'active':''} onClick={()=>setActiveTab(tab)}><span>{['◉','✦','▤','⌂','✳','♧','◈'][i]}</span>{tab}{activeTab===tab&&<b>›</b>}</button>)}</div>
          <div className="cv-studio-panel">
            {activeTab==='Design'?<>
              <h2>Design your CV</h2><p className="cv-panel-hint">Make the look yours.</p>
              <label className="cv-studio-field"><span>Accent color</span><div className="cv-palette">{palette.map(p=><button key={p.name} title={p.name} aria-label={p.name} className={accent===p.value?'selected':''} style={{'--swatch':p.value}} onClick={()=>setAccent(p.value)}/>)}</div></label>
              <label className="cv-studio-field"><span>Font style</span><select value={font} onChange={e=>setFont(e.target.value)}><option value="Inter, Arial, sans-serif">Modern</option><option value="Georgia, serif">Editorial</option><option value="'Trebuchet MS', Arial, sans-serif">Friendly</option><option value="'Courier New', monospace">Technical</option></select></label>
              <PhotoControl photo={photo} setPhoto={setPhoto}/>
              <button className="cv-secondary-btn cv-wide" onClick={()=>{setForm(defaults);setPhoto('');setAccent('#2563eb');setFont('Inter, Arial, sans-serif');setNotice('Your CV has been reset.')}}>Reset CV</button>
            </>:<>
              <h2>{activeTab==='Personal'?'Your details':activeTab==='Profile'?'Professional profile':activeTab==='Experience'?'Work experience':activeTab==='Education'?'Education history':activeTab==='Skills'?'Skills & languages':'Certificates'}</h2>
              <p className="cv-panel-hint">Your changes appear in the preview instantly.</p>
              {activeTab==='Personal'&&<PhotoControl photo={photo} setPhoto={setPhoto}/>}
              {(groups[activeTab]||[]).map(name=><Field key={name} name={name} form={form} setForm={setForm}/>)}
              {activeTab==='Profile'&&<button className="cv-ai-btn" disabled={aiBusy} onClick={improveSummary}>{aiBusy?'✦ Improving…':'✦ Improve with AI'}</button>}
              {notice&&<p className="cv-studio-notice" role="status">{notice}</p>}
              <div className="cv-panel-bottom"><button className="cv-secondary-btn" disabled={activeTab==='Personal'} onClick={()=>setActiveTab(['Personal','Profile','Experience','Education','Skills','Certificates','Design'][Math.max(0,['Personal','Profile','Experience','Education','Skills','Certificates','Design'].indexOf(activeTab)-1)])}>← Back</button><button className="cv-next-btn" onClick={()=>setActiveTab(['Personal','Profile','Experience','Education','Skills','Certificates','Design'][Math.min(6,['Personal','Profile','Experience','Education','Skills','Certificates','Design'].indexOf(activeTab)+1)])}>{activeTab==='Certificates'?'Style CV':'Continue →'}</button></div>
            </>}
          </div>
        </aside>
        <section className="cv-studio-preview-area">
          <div className="cv-preview-toolbar"><div><b>{activeTab==='Design'?'Choose your style':template.name+' template'}</b><span> • Live preview</span></div><div className="cv-zoom-controls"><button aria-label="Zoom out" onClick={()=>setZoom(v=>Math.max(55,v-10))}>−</button><span>{zoom}%</span><button aria-label="Zoom in" onClick={()=>setZoom(v=>Math.min(100,v+10))}>+</button><button className="cv-toolbar-download" onClick={printCV}>Export PDF ↗</button></div></div>
          <div className="cv-paper-stage"><div className="cv-paper-scale" style={{'--cv-zoom':zoom/100}}><CvPreview form={form} template={template} photo={photo} accent={accent} font={font}/></div></div>
          <div className="cv-template-drawer"><div className="cv-drawer-heading"><div><h2>Templates</h2><p>Pick a layout that fits your story.</p></div><label className="cv-template-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search styles"/></label></div><div className="cv-template-list">{filtered.map(t=><button key={t.id} className={'cv-template-option '+(templateId===t.id?'selected':'')} onClick={()=>{setTemplateId(t.id);setAccent(t.color)}}><div className={'cv-template-mini cv-mini-'+t.layout} style={{'--mini-accent':t.color}}><i/><i/><i/><i/><b/></div><strong>{t.name}</strong><small>{t.label}</small>{templateId===t.id&&<span className="cv-template-check">✓</span>}</button>)}</div></div>
          <div className="cv-studio-footnote"><span>✓ Your CV is edited in this browser session.</span><span>PDF export uses your browser's print dialog — choose “Save as PDF”.</span></div>
        </section>
      </div>
    </main>
    <footer>© 2026 QuickToolBox <span>• Free CV builder</span></footer>
  </>;
}
