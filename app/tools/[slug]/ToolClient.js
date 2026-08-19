'use client';
import Link from 'next/link';
import {useState,useRef,useEffect} from 'react';
import QRCode from 'qrcode';
import {PDFDocument} from 'pdf-lib';
import {utilityTools} from '../../../lib/tools';
import {recordVisit,isFavorite,toggleFavorite} from '../../../lib/usage';
const META=Object.fromEntries(utilityTools.map(([slug,icon,title,desc])=>[slug,[title,desc,icon]]));
const Field=({label,...p})=><label className="field"><span>{label}</span><input {...p}/></label>;
const Button=({children,onClick,light=false})=><button className="btn" style={light?{background:'#f2f4f7',color:'#344054'}:{}} onClick={onClick}>{children}</button>;
const Download=({data,name,type='text/plain'})=><a className="btn" href={data?.startsWith('data:')?data:`data:${type};charset=utf-8,${encodeURIComponent(data||'')}`} download={name}>Download</a>;
function PDFMerge(){const[fs,setFs]=useState([]),[r,setR]=useState('');async function go(){try{if(!fs.length)return setR('Select PDF files.');const out=await PDFDocument.create();for(const f of fs){const d=await PDFDocument.load(await f.arrayBuffer());(await out.copyPages(d,d.getPageIndices())).forEach(p=>out.addPage(p))}const u=URL.createObjectURL(new Blob([await out.save()],{type:'application/pdf'}));const a=document.createElement('a');a.href=u;a.download='merged.pdf';a.click();setR('Merged PDF downloaded.')}catch(e){setR('Could not read a PDF.')}}return <><Upload label="Choose PDF files" accept="application/pdf" multiple onChange={e=>setFs(Array.from(e.target.files||[]))}/><Button onClick={go}>Merge PDFs</Button><p>{r}</p></>}
function PDFSplit(){const[f,setF]=useState(null),[page,setPage]=useState('1'),[r,setR]=useState('');async function go(){try{if(!f)return setR('Choose a PDF.');const d=await PDFDocument.load(await f.arrayBuffer()),nums=page.split(',').map(x=>parseInt(x.trim(),10)-1).filter(x=>x>=0&&x<d.getPageCount());if(!nums.length)return setR('Enter valid page numbers.');const out=await PDFDocument.create();(await out.copyPages(d,nums)).forEach(p=>out.addPage(p));const u=URL.createObjectURL(new Blob([await out.save()],{type:'application/pdf'}));const a=document.createElement('a');a.href=u;a.download='split-pages.pdf';a.click();setR('Selected pages downloaded.')}catch{setR('Invalid PDF.')}}return <><Upload label="Choose PDF" accept="application/pdf" onChange={e=>setF(e.target.files?.[0])}/><Field label="Pages (example: 1,3,5)" value={page} onChange={e=>setPage(e.target.value)}/><Button onClick={go}>Split PDF</Button><p>{r}</p></>}
function PDFCompress(){const[f,setF]=useState(null),[r,setR]=useState('');async function go(){try{if(!f)return setR('Choose a PDF.');const d=await PDFDocument.load(await f.arrayBuffer());const bytes=await d.save({useObjectStreams:true,addDefaultPage:false});const u=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=u;a.download='optimized.pdf';a.click();setR(`Saved optimized PDF (${Math.round(bytes.length/1024)} KB).`)}catch{setR('Could not optimize this PDF.')}}return <><Upload label="Choose PDF" accept="application/pdf" onChange={e=>setF(e.target.files?.[0])}/><Button onClick={go}>Optimize PDF</Button><p>{r}</p><small>Browser optimization cannot guarantee a smaller file for every PDF.</small></>}
function ImagePDF(){const[fs,setFs]=useState([]),[r,setR]=useState('');async function go(){try{if(!fs.length)return setR('Choose images.');const out=await PDFDocument.create();for(const f of fs){const bytes=await f.arrayBuffer();let im; if(f.type==='image/png') im=await out.embedPng(bytes); else im=await out.embedJpg(bytes);const p=out.addPage([595,842]);const s=Math.min(555/im.width,802/im.height);p.drawImage(im,{x:(595-im.width*s)/2,y:(842-im.height*s)/2,width:im.width*s,height:im.height*s})}const u=URL.createObjectURL(new Blob([await out.save()],{type:'application/pdf'}));const a=document.createElement('a');a.href=u;a.download='images.pdf';a.click();setR('PDF downloaded.')}catch{setR('Use JPG or PNG images.')}}return <><Upload label="Choose JPG/PNG images" accept="image/jpeg,image/png" multiple onChange={e=>setFs(Array.from(e.target.files||[]))}/><Button onClick={go}>Create PDF</Button><p>{r}</p></>}
function Passport(){const[f,setF]=useState(null),[o,setO]=useState('');function go(){if(!f)return;const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=600;c.height=600;const x=c.getContext('2d'),s=Math.max(600/im.width,600/im.height);const w=im.width*s,h=im.height*s;x.drawImage(im,(600-w)/2,(600-h)/2,w,h);setO(c.toDataURL('image/jpeg',.92))};im.src=URL.createObjectURL(f)}return <><Upload label="Choose portrait" accept="image/*" onChange={e=>setF(e.target.files?.[0])}/><Button onClick={go}>Make Photo</Button>{o&&<><img src={o} alt="Passport photo" style={{maxWidth:'280px',display:'block',marginTop:16}}/><Download data={o} name="passport-photo.jpg"/></>}</>}
function GPA(){const[rows,setRows]=useState([{c:3,g:4},{c:3,g:3.5}]),[r,setR]=useState('');return <><p>Enter credit and grade points.</p>{rows.map((x,i)=><div className="row" key={i}><Field label="Credits" type="number" value={x.c} onChange={e=>{const a=[...rows];a[i].c=e.target.value;setRows(a)}}/><Field label="Grade points" type="number" step="0.01" value={x.g} onChange={e=>{const a=[...rows];a[i].g=e.target.value;setRows(a)}}/></div>)}<Button light onClick={()=>setRows([...rows,{c:3,g:4}])}>Add subject</Button><Button onClick={()=>{const c=rows.reduce((a,x)=>a+Number(x.c),0),p=rows.reduce((a,x)=>a+Number(x.c)*Number(x.g),0);setR(c?(p/c).toFixed(2):'0')}}>Calculate GPA</Button>{r&&<div className="result">GPA: {r}</div>}</>}
function EMI(){const[p,setP]=useState(500000),[rate,setRate]=useState(10),[years,setYears]=useState(5),[r,setR]=useState('');function go(){const n=years*12,m=rate/1200,e=m?Number(p)*m*Math.pow(1+m,n)/(Math.pow(1+m,n)-1):Number(p)/n;setR(`Monthly EMI: ${e.toFixed(2)} | Total interest: ${(e*n-p).toFixed(2)}`)}return <><Field label="Loan amount" type="number" value={p} onChange={e=>setP(e.target.value)}/><Field label="Annual interest %" type="number" value={rate} onChange={e=>setRate(e.target.value)}/><Field label="Years" type="number" value={years} onChange={e=>setYears(e.target.value)}/><Button onClick={go}>Calculate EMI</Button>{r&&<div className="result">{r}</div>}</>}
function Salary(){const[g,setG]=useState(50000),[ded,setD]=useState(10),[r,setR]=useState('');return <><Field label="Gross salary" type="number" value={g} onChange={e=>setG(e.target.value)}/><Field label="Deductions %" type="number" value={ded} onChange={e=>setD(e.target.value)}/><Button onClick={()=>{const n=Number(g)*(1-Number(ded)/100);setR(`Estimated net salary: ${n.toFixed(2)}`)}}>Calculate</Button>{r&&<div className="result">{r}</div>}<small>Generic estimate; payroll rules vary by country and employer.</small></>}
function TaxVAT(){const[a,setA]=useState(1000),[v,setV]=useState(15),[r,setR]=useState('');return <><Field label="Amount" type="number" value={a} onChange={e=>setA(e.target.value)}/><Field label="VAT %" type="number" value={v} onChange={e=>setV(e.target.value)}/><Button onClick={()=>{const tax=Number(a)*Number(v)/100;setR(`VAT: ${tax.toFixed(2)} | Total: ${(Number(a)+tax).toFixed(2)}`)}}>Calculate VAT</Button>{r&&<div className="result">{r}</div>}<small>VAT calculator only; income-tax liability requires jurisdiction-specific rules.</small></>}
function Invoice(){const[c,setC]=useState('Customer'),[items,setItems]=useState([{n:'Service',q:1,p:100}]);const total=items.reduce((a,x)=>a+Number(x.q)*Number(x.p),0);return <><Field label="Customer" value={c} onChange={e=>setC(e.target.value)}/>{items.map((x,i)=><div className="row" key={i}><Field label="Item" value={x.n} onChange={e=>{const a=[...items];a[i].n=e.target.value;setItems(a)}}/><Field label="Qty" type="number" value={x.q} onChange={e=>{const a=[...items];a[i].q=e.target.value;setItems(a)}}/><Field label="Price" type="number" value={x.p} onChange={e=>{const a=[...items];a[i].p=e.target.value;setItems(a)}}/></div>)}<Button light onClick={()=>setItems([...items,{n:'Service',q:1,p:0}])}>Add item</Button><div className="result">Total: {total.toFixed(2)}</div><Button onClick={()=>window.print()}>Print / Save PDF</Button></>}
function Cover(){const[n,setN]=useState('Your Name'),[j,setJ]=useState('Job Title'),[co,setCo]=useState('Company'),[r,setR]=useState('');return <><Field label="Your name" value={n} onChange={e=>setN(e.target.value)}/><Field label="Job title" value={j} onChange={e=>setJ(e.target.value)}/><Field label="Company" value={co} onChange={e=>setCo(e.target.value)}/><Button onClick={()=>setR(`Dear Hiring Manager,\n\nI am ${n}, and I am excited to apply for the ${j} position at ${co}. My skills, reliability and willingness to learn would allow me to contribute positively to your team.\n\nI would welcome the opportunity to discuss my application. Thank you for your consideration.\n\nSincerely,\n${n}`)}>Build Cover Letter</Button>{r&&<textarea rows="12" value={r} readOnly/>}<Button light onClick={()=>r&&navigator.clipboard?.writeText(r)}>Copy</Button></>}
function QRScan(){const[v,setV]=useState(''),ref=useRef(null),stream=useRef(null);async function start(){try{if(!('BarcodeDetector' in window))return setV('This browser does not support BarcodeDetector. Use a QR scanner app/browser that supports it.');const d=new BarcodeDetector({formats:['qr_code']});stream.current=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});const video=ref.current;video.srcObject=stream.current;await video.play();const scan=async()=>{try{const a=await d.detect(video);if(a[0]){setV(a[0].rawValue);stream.current?.getTracks().forEach(t=>t.stop());return}}catch{}requestAnimationFrame(scan)};scan()}catch{setV('Camera permission was denied or unavailable.')}}return <><video ref={ref} playsInline muted style={{width:'100%',maxWidth:420,borderRadius:12}}/><Button onClick={start}>Start Camera Scan</Button>{v&&<div className="result">{v}</div>}</>}
function Shortener(){const[u,setU]=useState('https://example.com'),[r,setR]=useState(''),[busy,setB]=useState(false);return <><Field label="Long URL" type="url" value={u} onChange={e=>setU(e.target.value)}/><Button onClick={async()=>{setB(true);try{const x=await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(u)}`);setR(await x.text())}catch{setR('Shortening service unavailable.')}finally{setB(false)}}}>{busy?'Shortening…':'Shorten URL'}</Button>{r&&<div className="result">{r}</div>}</>}
function JSONTool(){const[t,setT]=useState('{"name":"QuickToolBox","ok":true}'),[r,setR]=useState('');return <><textarea rows="14" value={t} onChange={e=>setT(e.target.value)}/><div className="row"><Button onClick={()=>{try{setR(JSON.stringify(JSON.parse(t),null,2))}catch(e){setR('Invalid JSON: '+e.message)}}}>Format / Validate</Button><Button light onClick={()=>{try{setR(JSON.stringify(JSON.parse(t)))}catch(e){setR('Invalid JSON: '+e.message)}}}>Minify</Button></div>{r&&<textarea rows="14" value={r} readOnly/>}</>}
function Favicon(){const[f,setF]=useState(null),[o,setO]=useState('');function go(){if(!f)return;const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(im,0,0,256,256);setO(c.toDataURL('image/png'))};im.src=URL.createObjectURL(f)}return <><Upload label="Choose image" accept="image/*" onChange={e=>setF(e.target.files?.[0])}/><Button onClick={go}>Generate Favicon</Button>{o&&<><img src={o} alt="Favicon preview" style={{width:128,height:128}}/><Download data={o} name="favicon.png"/></>}</>}
function Meta(){const[t,setT]=useState('QuickToolBox'),[d,setD]=useState('Free useful online tools'),[u,setU]=useState('https://example.com'),[r,setR]=useState('');return <><Field label="Title" value={t} onChange={e=>setT(e.target.value)}/><Field label="Description" value={d} onChange={e=>setD(e.target.value)}/><Field label="Canonical URL" value={u} onChange={e=>setU(e.target.value)}/><Button onClick={()=>setR(`<title>${t}</title>\n<meta name="description" content="${d.replaceAll('"','&quot;')}">\n<link rel="canonical" href="${u}">\n<meta property="og:title" content="${t}">\n<meta property="og:description" content="${d.replaceAll('"','&quot;')}">\n<meta property="og:url" content="${u}">`)}>Generate Tags</Button>{r&&<textarea rows="10" value={r} readOnly/>}</>}
function Sitemap(){const[u,setU]=useState('https://example.com/\nhttps://example.com/about'),[r,setR]=useState('');return <><textarea rows="10" value={u} onChange={e=>setU(e.target.value)}/><Button onClick={()=>setR(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${u.split(/\n+/).filter(Boolean).map(x=>`  <url><loc>${x.trim()}</loc></url>`).join('\n')}\n</urlset>`)}>Generate Sitemap</Button>{r&&<><textarea rows="12" value={r} readOnly/><Download data={r} name="sitemap.xml" type="application/xml"/></>}</>}
function Strength(){const[p,setP]=useState(''),[r,setR]=useState('');function go(){let s=0;if(p.length>=8)s++;if(p.length>=12)s++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p))s++;if(/\d/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;setR(['Very weak','Weak','Fair','Good','Strong','Excellent'][s])}return <><Field label="Password" type="password" value={p} onChange={e=>setP(e.target.value)}/><Button onClick={go}>Check Strength</Button>{r&&<div className="result">Strength: {r}</div>}</>}
function Clock(){const zones=['Asia/Dhaka','Asia/Kolkata','Asia/Dubai','Europe/London','Europe/Paris','America/New_York','America/Los_Angeles','Asia/Tokyo','Australia/Sydney'];const[t,setT]=useState(Date.now());useEffect(()=>{const i=setInterval(()=>setT(Date.now()),1000);return()=>clearInterval(i)},[]);return <div className="grid">{zones.map(z=><div className="card" key={z}><h3>{z}</h3><p>{new Intl.DateTimeFormat('en-US',{timeZone:z,dateStyle:'medium',timeStyle:'medium'}).format(t)}</p></div>)}</div>}
function QRGen(){const[text,setText]=useState('https://quicktoolbox.app'),[img,setImg]=useState(''),[size,setSize]=useState(512),[err,setErr]=useState('');
async function go(){const v=text.trim();if(!v){setErr('Enter text or a URL.');setImg('');return}try{setImg(await QRCode.toDataURL(v,{width:Number(size)||512,margin:2}));setErr('')}catch{setErr('Could not generate a QR code for this input.')}}
useEffect(()=>{go()},[]);// eslint-disable-line react-hooks/exhaustive-deps
return <><Field label="Text or URL" value={text} onChange={e=>setText(e.target.value)}/><Field label="Size (px)" type="number" min="128" max="1024" step="64" value={size} onChange={e=>setSize(e.target.value)}/><Button onClick={go}>Generate QR Code</Button>{err&&<div className="result">{err}</div>}{img&&<div style={{marginTop:18}}><img src={img} alt="Generated QR code" style={{width:260,maxWidth:'100%',background:'#fff',borderRadius:12,border:'1px solid #e5e7f2'}}/><div><a className="btn" href={img} download="qr-code.png">Download PNG</a></div></div>}</>}

function ImageCompress(){const[f,setF]=useState(null),[q,setQ]=useState(70),[out,setOut]=useState(null),[busy,setBusy]=useState(false);
function go(){if(!f)return;setBusy(true);const im=new Image();const url=URL.createObjectURL(f);
im.onload=()=>{const max=1920;let{width:w,height:h}=im;if(w>max||h>max){const s=Math.min(max/w,max/h);w=Math.round(w*s);h=Math.round(h*s)}
const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(im,0,0,w,h);
const data=c.toDataURL('image/jpeg',Math.min(100,Math.max(1,Number(q)))/100);
const bytes=Math.round((data.length-data.indexOf(',')-1)*3/4);
setOut({data,bytes,w,h});setBusy(false);URL.revokeObjectURL(url)};
im.onerror=()=>{setBusy(false);setOut(null)};im.src=url}
const kb=n=>n>=1048576?`${(n/1048576).toFixed(2)} MB`:`${Math.max(1,Math.round(n/1024))} KB`;
return <><Upload label="Choose an image (JPG, PNG, WebP)" accept="image/*" onChange={e=>{setF(e.target.files?.[0]||null);setOut(null)}}/>
{f&&<p>Selected: {f.name} — {kb(f.size)}</p>}
<Field label={`Quality: ${q}%`} type="range" min="10" max="95" step="5" value={q} onChange={e=>setQ(e.target.value)}/>
<Button onClick={go}>{busy?'Compressing…':'Compress Image'}</Button>
{out&&<><div className="result">{kb(f.size)} → {kb(out.bytes)} ({out.bytes<f.size?`${Math.round((1-out.bytes/f.size)*100)}% smaller`:'no reduction — try lower quality'}) • {out.w}×{out.h}px</div>
<img src={out.data} alt="Compressed preview" style={{maxWidth:'100%',marginTop:14,borderRadius:12}}/>
<div><a className="btn" href={out.data} download="compressed.jpg">Download JPG</a></div></>}
<small>Images are processed entirely in your browser — nothing is uploaded.</small></>}

function AgeCalc(){const[dob,setDob]=useState(''),[on,setOn]=useState(()=>new Date().toISOString().slice(0,10)),[r,setR]=useState('');
function go(){const b=new Date(dob),t=new Date(on);if(Number.isNaN(b.getTime()))return setR('Choose your date of birth.');if(Number.isNaN(t.getTime()))return setR('Choose a valid target date.');if(b>t)return setR('Date of birth is after the selected date.');
let y=t.getFullYear()-b.getFullYear(),m=t.getMonth()-b.getMonth(),d=t.getDate()-b.getDate();
if(d<0){m-=1;d+=new Date(t.getFullYear(),t.getMonth(),0).getDate()}if(m<0){y-=1;m+=12}
const days=Math.floor((t-b)/86400000);
const next=new Date(t.getFullYear(),b.getMonth(),b.getDate());if(next<t)next.setFullYear(t.getFullYear()+1);
setR(`Age: ${y} years, ${m} months, ${d} days\nTotal: ${days.toLocaleString()} days • ${Math.floor(days/7).toLocaleString()} weeks • ${(y*12+m).toLocaleString()} months\nNext birthday in ${Math.ceil((next-t)/86400000)} day(s)`)}
return <><Field label="Date of birth" type="date" value={dob} onChange={e=>setDob(e.target.value)}/><Field label="Age on date" type="date" value={on} onChange={e=>setOn(e.target.value)}/><Button onClick={go}>Calculate Age</Button>{r&&<pre className="result" style={{whiteSpace:'pre-wrap',fontFamily:'inherit'}}>{r}</pre>}</>}

function DateCalc(){const[mode,setMode]=useState('diff'),[a,setA]=useState(()=>new Date().toISOString().slice(0,10)),[b,setB]=useState(''),[days,setDays]=useState(30),[r,setR]=useState('');
function go(){const d1=new Date(a);if(Number.isNaN(d1.getTime()))return setR('Choose a valid start date.');
if(mode==='diff'){const d2=new Date(b);if(Number.isNaN(d2.getTime()))return setR('Choose a valid second date.');
const diff=Math.round((d2-d1)/86400000);const abs=Math.abs(diff);
let wd=0;const cur=new Date(Math.min(d1,d2));const end=new Date(Math.max(d1,d2));
while(cur<end){const day=cur.getDay();if(day!==0&&day!==6)wd+=1;cur.setDate(cur.getDate()+1)}
return setR(`${abs.toLocaleString()} day(s) ${diff<0?'before':'after'} the start date\n${Math.floor(abs/7)} weeks and ${abs%7} day(s)\nWeekdays (Mon–Fri): ${wd.toLocaleString()}`)}
const n=parseInt(days,10);if(!Number.isFinite(n))return setR('Enter a number of days.');
const out=new Date(d1);out.setDate(out.getDate()+(mode==='add'?n:-n));
return setR(`${mode==='add'?'Date after':'Date before'} ${n} day(s):\n${out.toDateString()}\n${out.toISOString().slice(0,10)}`)}
return <><label className="field"><span>Mode</span><select value={mode} onChange={e=>{setMode(e.target.value);setR('')}}><option value="diff">Days between two dates</option><option value="add">Add days to a date</option><option value="sub">Subtract days from a date</option></select></label>
<Field label="Start date" type="date" value={a} onChange={e=>setA(e.target.value)}/>
{mode==='diff'?<Field label="End date" type="date" value={b} onChange={e=>setB(e.target.value)}/>:<Field label="Number of days" type="number" value={days} onChange={e=>setDays(e.target.value)}/>}
<Button onClick={go}>Calculate</Button>{r&&<pre className="result" style={{whiteSpace:'pre-wrap',fontFamily:'inherit'}}>{r}</pre>}</>}

const UNITS={length:{name:'Length',base:'m',u:{Meter:1,Kilometer:1000,Centimeter:.01,Millimeter:.001,Mile:1609.344,Yard:.9144,Foot:.3048,Inch:.0254,'Nautical mile':1852}},
weight:{name:'Weight',base:'kg',u:{Kilogram:1,Gram:.001,Milligram:1e-6,'Metric ton':1000,Pound:.45359237,Ounce:.028349523125,Stone:6.35029318}},
volume:{name:'Volume',base:'L',u:{Liter:1,Milliliter:.001,'Cubic meter':1000,'Gallon (US)':3.785411784,'Quart (US)':.946352946,'Pint (US)':.473176473,'Cup (US)':.2365882365,'Fluid ounce (US)':.0295735295625}},
area:{name:'Area',base:'m²',u:{'Square meter':1,'Square kilometer':1e6,'Square foot':.09290304,'Square yard':.83612736,Acre:4046.8564224,Hectare:10000}},
speed:{name:'Speed',base:'m/s',u:{'Meter/second':1,'Kilometer/hour':.277777778,'Mile/hour':.44704,Knot:.514444444}}};
function UnitConv(){const[cat,setCat]=useState('length');const keys=Object.keys(UNITS[cat].u);
const[from,setFrom]=useState(keys[0]),[to,setTo]=useState(keys[1]),[val,setVal]=useState(1);
useEffect(()=>{const k=Object.keys(UNITS[cat].u);setFrom(k[0]);setTo(k[1])},[cat]);
let out='';
const f=UNITS[cat].u[from],t=UNITS[cat].u[to];
if(Number.isFinite(Number(val))&&f&&t)out=`${Number(val).toLocaleString()} ${from} = ${(Number(val)*f/t).toLocaleString(undefined,{maximumFractionDigits:8})} ${to}`;
return <><label className="field"><span>Category</span><select value={cat} onChange={e=>setCat(e.target.value)}>{Object.entries(UNITS).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}</select></label>
<Field label="Value" type="number" value={val} onChange={e=>setVal(e.target.value)}/>
<div className="row"><label className="field"><span>From</span><select value={from} onChange={e=>setFrom(e.target.value)}>{Object.keys(UNITS[cat].u).map(k=><option key={k}>{k}</option>)}</select></label>
<label className="field"><span>To</span><select value={to} onChange={e=>setTo(e.target.value)}>{Object.keys(UNITS[cat].u).map(k=><option key={k}>{k}</option>)}</select></label></div>
<Button light onClick={()=>{const a=from;setFrom(to);setTo(a)}}>⇄ Swap</Button>
{out&&<div className="result">{out}</div>}<TempConv/></>}
function TempConv(){const[v,setV]=useState(25),[u,setU]=useState('C');const n=Number(v);
const c=u==='C'?n:u==='F'?(n-32)*5/9:n-273.15;
return <div style={{marginTop:22,paddingTop:18,borderTop:'1px solid #e5e7f2'}}><h3 style={{margin:'0 0 10px'}}>Temperature</h3>
<div className="row"><Field label="Value" type="number" value={v} onChange={e=>setV(e.target.value)}/>
<label className="field"><span>Unit</span><select value={u} onChange={e=>setU(e.target.value)}><option value="C">Celsius</option><option value="F">Fahrenheit</option><option value="K">Kelvin</option></select></label></div>
{Number.isFinite(n)&&<div className="result">{c.toFixed(2)} °C • {(c*9/5+32).toFixed(2)} °F • {(c+273.15).toFixed(2)} K</div>}</div>}

function CurrencyConv(){const[amt,setAmt]=useState(100),[from,setFrom]=useState('USD'),[to,setTo]=useState('BDT'),[r,setR]=useState(''),[busy,setBusy]=useState(false),[rates,setRates]=useState(null);
const codes=['USD','EUR','GBP','BDT','INR','PKR','JPY','CNY','AUD','CAD','SAR','AED','MYR','SGD','TRY','ZAR'];
async function go(){setBusy(true);setR('Fetching live rates…');
try{const res=await fetch(`https://api.frankfurter.app/latest?base=${from}&symbols=${to}`);
if(res.ok){const j=await res.json();const rate=j?.rates?.[to];
if(rate){setRates({rate,date:j.date});setBusy(false);return setR(`${Number(amt).toLocaleString()} ${from} = ${(Number(amt)*rate).toLocaleString(undefined,{maximumFractionDigits:2})} ${to}\nRate: 1 ${from} = ${rate} ${to} (${j.date})`)}}
const res2=await fetch(`https://open.er-api.com/v6/latest/${from}`);const j2=await res2.json();const rate2=j2?.rates?.[to];
if(rate2)return setR(`${Number(amt).toLocaleString()} ${from} = ${(Number(amt)*rate2).toLocaleString(undefined,{maximumFractionDigits:2})} ${to}\nRate: 1 ${from} = ${rate2} ${to}`);
setR('Exchange rate service did not return a rate for this pair.')}
catch{setR('Could not reach the exchange-rate service. Check your connection and try again.')}
finally{setBusy(false)}}
return <><Field label="Amount" type="number" value={amt} onChange={e=>setAmt(e.target.value)}/>
<div className="row"><label className="field"><span>From</span><select value={from} onChange={e=>setFrom(e.target.value)}>{codes.map(c=><option key={c}>{c}</option>)}</select></label>
<label className="field"><span>To</span><select value={to} onChange={e=>setTo(e.target.value)}>{codes.map(c=><option key={c}>{c}</option>)}</select></label></div>
<Button light onClick={()=>{const a=from;setFrom(to);setTo(a)}}>⇄ Swap</Button>
<Button onClick={go}>{busy?'Converting…':'Convert'}</Button>
{r&&<pre className="result" style={{whiteSpace:'pre-wrap',fontFamily:'inherit'}}>{r}</pre>}
<small>Live rates from public exchange-rate APIs. For reference only.</small></>}

function WordCounter(){const[t,setT]=useState('');
const words=(t.trim().match(/\S+/g)||[]).length;
const sentences=(t.match(/[^.!?]+[.!?]+/g)||[]).length||(t.trim()?1:0);
const paras=t.trim()?t.trim().split(/\n{2,}/).length:0;
return <><textarea rows="12" value={t} onChange={e=>setT(e.target.value)} placeholder="Type or paste your text here…"/>
<div className="grid" style={{marginTop:16}}>
{[['Words',words],['Characters',t.length],['Characters (no spaces)',t.replace(/\s/g,'').length],['Sentences',sentences],['Paragraphs',paras],['Reading time',`~${Math.max(t.trim()?1:0,Math.ceil(words/200))} min`]].map(([k,v])=>
<div className="card" key={k} style={{gridTemplateColumns:'1fr'}}><div><h3 style={{fontSize:26,margin:0}}>{v}</h3><p>{k}</p></div></div>)}</div>
<Button light onClick={()=>{setT('')}}>Clear</Button></>}

function PassGen(){const[len,setLen]=useState(16),[up,setUp]=useState(true),[low,setLow]=useState(true),[dig,setDig]=useState(true),[sym,setSym]=useState(true),[out,setOut]=useState(''),[copied,setCopied]=useState('');
function go(){let pool='';if(up)pool+='ABCDEFGHJKLMNPQRSTUVWXYZ';if(low)pool+='abcdefghijkmnopqrstuvwxyz';if(dig)pool+='23456789';if(sym)pool+='!@#$%^&*()-_=+[]{}?';
if(!pool)return setOut('Select at least one character type.');
const n=Math.min(128,Math.max(4,Number(len)||16));const a=new Uint32Array(n);
(window.crypto||window.msCrypto).getRandomValues(a);
setOut(Array.from(a,x=>pool[x%pool.length]).join(''));setCopied('')}
useEffect(()=>{go()},[]);// eslint-disable-line react-hooks/exhaustive-deps
const strength=out.length>=16&&up&&low&&dig&&sym?'Excellent':out.length>=12?'Strong':out.length>=8?'Fair':'Weak';
return <><Field label={`Length: ${len}`} type="range" min="6" max="64" value={len} onChange={e=>setLen(e.target.value)}/>
<div className="toggle-row" style={{margin:'6px 0 16px'}}>
{[['Uppercase',up,setUp],['Lowercase',low,setLow],['Numbers',dig,setDig],['Symbols',sym,setSym]].map(([label,val,set])=>
<label key={label} style={{display:'flex',gap:7,alignItems:'center',fontWeight:700,cursor:'pointer'}}><input type="checkbox" checked={val} onChange={e=>set(e.target.checked)} style={{width:17,height:17}}/>{label}</label>)}</div>
<Button onClick={go}>Generate Password</Button>
{out&&<><div className="result" style={{fontFamily:'ui-monospace,Menlo,monospace',fontSize:18,wordBreak:'break-all'}}>{out}</div>
<p>Strength: <b>{strength}</b></p>
<Button light onClick={async()=>{try{await navigator.clipboard.writeText(out);setCopied('Copied to clipboard.')}catch{setCopied('Press and hold the password to copy it.')}}}>Copy</Button>{copied&&<span> {copied}</span>}</>}</>}

function PercentCalc(){const[a,setA]=useState(15),[b,setB]=useState(240),[c,setC]=useState(50),[d,setD]=useState(80),[e2,setE2]=useState(200),[f2,setF2]=useState(250);
const pctOf=Number.isFinite(Number(a))&&Number.isFinite(Number(b))?(Number(a)*Number(b))/100:NaN;
const isWhat=Number(d)?(Number(c)/Number(d))*100:NaN;
const change=Number(e2)?((Number(f2)-Number(e2))/Number(e2))*100:NaN;
return <><h3 style={{marginTop:0}}>What is X% of Y?</h3><div className="row"><Field label="X (%)" type="number" value={a} onChange={ev=>setA(ev.target.value)}/><Field label="Y" type="number" value={b} onChange={ev=>setB(ev.target.value)}/></div>
{Number.isFinite(pctOf)&&<div className="result">{a}% of {b} = {pctOf.toLocaleString(undefined,{maximumFractionDigits:4})}</div>}
<h3 style={{marginTop:26}}>X is what percent of Y?</h3><div className="row"><Field label="X" type="number" value={c} onChange={ev=>setC(ev.target.value)}/><Field label="Y" type="number" value={d} onChange={ev=>setD(ev.target.value)}/></div>
{Number.isFinite(isWhat)&&<div className="result">{c} is {isWhat.toLocaleString(undefined,{maximumFractionDigits:4})}% of {d}</div>}
<h3 style={{marginTop:26}}>Percentage increase / decrease</h3><div className="row"><Field label="From" type="number" value={e2} onChange={ev=>setE2(ev.target.value)}/><Field label="To" type="number" value={f2} onChange={ev=>setF2(ev.target.value)}/></div>
{Number.isFinite(change)&&<div className="result">{change>=0?'Increase':'Decrease'} of {Math.abs(change).toLocaleString(undefined,{maximumFractionDigits:4})}%</div>}</>}

function Upload({label,...p}){return <label className="upload">{label}<input type="file" {...p}/></label>}
function Tool({slug}){const map={'pdf-merge':<PDFMerge/>,'pdf-split':<PDFSplit/>,'pdf-compressor':<PDFCompress/>,'image-to-pdf':<ImagePDF/>,'passport-photo-maker':<Passport/>,'gpa-calculator':<GPA/>,'emi-calculator':<EMI/>,'salary-calculator':<Salary/>,'tax-vat-calculator':<TaxVAT/>,'invoice-generator':<Invoice/>,'cover-letter-builder':<Cover/>,'qr-scanner':<QRScan/>,'url-shortener':<Shortener/>,'json-formatter':<JSONTool/>,'favicon-generator':<Favicon/>,'meta-tag-generator':<Meta/>,'sitemap-generator':<Sitemap/>,'password-strength-checker':<Strength/>,'world-clock':<Clock/>,'qr-generator':<QRGen/>,'image-compressor':<ImageCompress/>,'age-calculator':<AgeCalc/>,'date-calculator':<DateCalc/>,'unit-converter':<UnitConv/>,'currency-converter':<CurrencyConv/>,'word-counter':<WordCounter/>,'password-generator':<PassGen/>,'percentage-calculator':<PercentCalc/>};return map[slug]||<p>Tool not found.</p>}
function FavButton({slug,title,href}){
  const [fav,setFav]=useState(false);
  useEffect(()=>{setFav(isFavorite(href))},[href]);
  return <button className="btn light" type="button" onClick={()=>setFav(toggleFavorite({slug,title,href}))}>
    {fav?'★ Favorited':'☆ Favorite'}
  </button>;
}

export default function ToolClient({slug}){
  const m=META[slug];
  const href=`/tools/${slug}`;
  useEffect(()=>{ if(m) recordVisit({slug,title:m[0],href}); },[slug,m,href]);

  if(!m) return <><header><Link className="brand" href="/"><b>Q</b> QuickToolBox</Link><Link href="/tools">← All tools</Link></header>
    <main className="tool"><h1>Tool not found</h1><p>This tool does not exist. Browse the full list instead.</p><Link className="btn" href="/tools">See all tools →</Link></main>
    <footer>© 2026 QuickToolBox</footer></>;

  return <><header><Link className="brand" href="/"><b>Q</b> QuickToolBox</Link><Link href="/tools">← All tools</Link></header>
    <main className="tool"><small>FREE ONLINE TOOL</small><div style={{fontSize:44,lineHeight:1.1,marginTop:10}}>{m[2]}</div>
    <h1>{m[0]}</h1><p>{m[1]}</p>
    <div style={{marginBottom:10}}><FavButton slug={slug} title={m[0]} href={href}/></div>
    <div className="box"><Tool slug={slug}/></div></main>
    <footer>© 2026 QuickToolBox <span>All tools are free.</span></footer></>;
}
