'use client';
import Link from 'next/link';
import {useState,useRef,useEffect} from 'react';
import QRCode from 'qrcode';
import {PDFDocument} from 'pdf-lib';
const TOOL_ICONS={
'pdf-merge':'📚','pdf-split':'✂️','pdf-compressor':'🗜️','image-to-pdf':'🖼️','passport-photo-maker':'🪪',
'gpa-calculator':'🎓','emi-calculator':'🏦','salary-calculator':'💵','tax-vat-calculator':'🧾','invoice-generator':'🧮',
'cover-letter-builder':'✉️','qr-scanner':'▦','url-shortener':'🔗','json-formatter':'{ }','favicon-generator':'🎨',
'meta-tag-generator':'🏷️','sitemap-generator':'🗺️','password-strength-checker':'🔐','world-clock':'🌐'
};
function getToolGroup(slug){
 if(slug.startsWith('pdf-')) return 'pdf';
 if(['image-to-pdf','passport-photo-maker','favicon-generator'].includes(slug)) return 'image';
 if(['gpa-calculator','emi-calculator','salary-calculator','tax-vat-calculator'].includes(slug)) return 'calculator';
 if(['json-formatter','meta-tag-generator','sitemap-generator'].includes(slug)) return 'developer';
 if(['qr-scanner','url-shortener'].includes(slug)) return 'connect';
 if(slug==='password-strength-checker') return 'security';
 if(slug==='world-clock') return 'time';
 return 'create';
}
const META={
'pdf-merge':['PDF Merge','Merge multiple PDF files in your browser.'],'pdf-split':['PDF Split','Split a PDF into selected pages.'],'pdf-compressor':['PDF Compressor','Optimize and save a PDF locally.'],'image-to-pdf':['Image → PDF','Convert images to PDF.'],'passport-photo-maker':['Passport Photo Maker','Create a 2×2 inch passport photo.'],'gpa-calculator':['GPA/CGPA Calculator','Calculate GPA or CGPA.'],'emi-calculator':['EMI Calculator','Calculate monthly loan EMI.'],'salary-calculator':['Salary Calculator','Estimate net salary.'],'tax-vat-calculator':['Tax/VAT Calculator','Calculate VAT and simple tax estimates.'],'invoice-generator':['Invoice Generator','Create and print an invoice.'],'cover-letter-builder':['Cover Letter Builder','Create a professional cover letter.'],'qr-scanner':['QR Scanner','Scan QR codes with a supported camera.'],'url-shortener':['URL Shortener','Shorten a URL with a public service.'],'json-formatter':['JSON Formatter','Format, validate and minify JSON.'],'favicon-generator':['Favicon Generator','Create a favicon from an image.'],'meta-tag-generator':['Meta Tag Generator','Generate SEO meta tags.'],'sitemap-generator':['Sitemap Generator','Generate XML sitemap content.'],'password-strength-checker':['Password Strength Checker','Check password strength locally.'],'world-clock':['World Clock / Timezone','View current time across time zones.']};
const Field=({label,...p})=><label className="field"><span>{label}</span><input {...p}/></label>;
const Button=({children,onClick,light=false})=><button className="btn" style={light?{background:'#f2f4f7',color:'#344054'}:{}} onClick={onClick}>{children}</button>;
const Download=({data,name,type='text/plain'})=><a className="btn" href={data?.startsWith('data:')?data:`data:${type};charset=utf-8,${encodeURIComponent(data||'')}`} download={name}>Download</a>;
function PDFMerge(){
 const[fs,setFs]=useState([]),[r,setR]=useState(''),[busy,setBusy]=useState(false);
 async function go(){
  if(fs.length<2)return setR('Select at least two PDF files to merge.');
  if(fs.some(f=>f.type!=='application/pdf'&&!/\\.pdf$/i.test(f.name)))return setR('Every selected file must be a PDF.');
  if(fs.reduce((n,f)=>n+f.size,0)>50*1024*1024)return setR('The combined file size must be under 50 MB.');
  setBusy(true);setR('Merging PDFs…');
  try{
   const out=await PDFDocument.create();
   for(const f of fs){const d=await PDFDocument.load(await f.arrayBuffer(),{ignoreEncryption:false});const pages=await out.copyPages(d,d.getPageIndices());pages.forEach(p=>out.addPage(p));}
   const bytes=await out.save(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');
   a.href=url;a.download='merged.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
   setR(`Success: merged ${fs.length} files and ${out.getPageCount()} pages. Download started.`);
  }catch(e){setR(/encrypt|password/i.test(e?.message||'')?'A PDF is password-protected. Unlock it before merging.':'Could not read one of the PDFs. Check that each file is valid and not password-protected.');}
  finally{setBusy(false);}
 }
 return <><Upload label="Choose at least 2 PDF files (max 50 MB total)" accept="application/pdf,.pdf" multiple onChange={e=>{setFs(Array.from(e.target.files||[]));setR('')}}/><p>{fs.length} file(s) selected</p><Button onClick={go}>{busy?'Merging…':'Merge PDFs'}</Button><p role="status">{r}</p></>;
}
function PDFSplit(){
 const[f,setF]=useState(null),[page,setPage]=useState('1'),[r,setR]=useState(''),[busy,setBusy]=useState(false);
 async function go(){
  if(!f)return setR('Choose a PDF first.');
  setBusy(true);setR('Splitting PDF…');
  try{
   const d=await PDFDocument.load(await f.arrayBuffer()),raw=page.split(',').map(x=>x.trim());
   if(!raw.length||raw.some(x=>!/^\\d+$/.test(x)))return setR('Enter page numbers separated by commas, for example 1,3,5.');
   const nums=raw.map(x=>Number(x)-1);
   if(nums.some(x=>x<0||x>=d.getPageCount()))return setR(`Page numbers must be between 1 and ${d.getPageCount()}.`);
   const out=await PDFDocument.create();(await out.copyPages(d,nums)).forEach(p=>out.addPage(p));
   const bytes=await out.save(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');
   a.href=url;a.download='split-pages.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
   setR(`Success: ${nums.length} page(s) exported. Download started.`);
  }catch(e){setR(/encrypt|password/i.test(e?.message||'')?'This PDF is password-protected. Unlock it before splitting.':'Invalid or unreadable PDF. Please choose another file.');}
  finally{setBusy(false);}
 }
 return <><Upload label="Choose PDF" accept="application/pdf,.pdf" onChange={e=>{setF(e.target.files?.[0]||null);setR('')}}/><Field label="Pages (example: 1,3,5)" value={page} onChange={e=>setPage(e.target.value)}/><Button onClick={go}>{busy?'Splitting…':'Split PDF'}</Button><p role="status">{r}</p></>;
}
async function loadPdfJs(){
 if(window.pdfjsLib)return window.pdfjsLib;
 await new Promise((resolve,reject)=>{const existing=document.getElementById('qt-pdfjs');if(existing&&window.pdfjsLib)return resolve();const s=document.createElement('script');s.id='qt-pdfjs';s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=resolve;s.onerror=()=>reject(new Error('Could not load the PDF processing library.'));document.head.appendChild(s)});
 if(!window.pdfjsLib)throw new Error('PDF processing library unavailable.');
 window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 return window.pdfjsLib;
}
function PDFCompress(){
 const[f,setF]=useState(null),[r,setR]=useState(''),[busy,setBusy]=useState(false),[quality,setQuality]=useState('0.65');
 async function go(){
  if(!f)return setR('Choose a PDF first.');
  if(f.size>30*1024*1024)return setR('Please use a PDF smaller than 30 MB.');
  setBusy(true);setR('Optimizing pages…');
  let source;
  try{
   const pdfjs=await loadPdfJs();source=await pdfjs.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise;
   if(source.numPages>40)throw new Error('For performance, compress PDFs up to 40 pages at a time.');
   const out=await PDFDocument.create();
   for(let n=1;n<=source.numPages;n++){
    const page=await source.getPage(n),viewport=page.getViewport({scale:1}),scale=0.85,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Canvas is not available in this browser.');
    canvas.width=Math.max(1,Math.floor(viewport.width*scale));canvas.height=Math.max(1,Math.floor(viewport.height*scale));
    await page.render({canvasContext:ctx,viewport:page.getViewport({scale})}).promise;
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',Number(quality)));
    if(!blob)throw new Error('Could not encode a PDF page.');
    const image=await out.embedJpg(await blob.arrayBuffer()),pdfPage=out.addPage([viewport.width,viewport.height]);
    pdfPage.drawImage(image,{x:0,y:0,width:viewport.width,height:viewport.height});page.cleanup();canvas.width=1;canvas.height=1;
   }
   const bytes=await out.save({useObjectStreams:true});
   if(bytes.length>=f.size){setR('This PDF is already smaller than the optimized image version. No larger replacement was downloaded. Try a lower image quality or keep the original PDF.');return;}
   const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download='compressed.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
   const before=(f.size/1024).toFixed(1),after=(bytes.length/1024).toFixed(1),delta=((1-bytes.length/f.size)*100).toFixed(1);
   setR(`Success: ${before} KB → ${after} KB (${delta}% smaller). Note: pages are rasterized; selectable text, links, forms and accessibility may be lost.`);
  }catch(e){setR(e?.message||'Compression failed. Try another PDF.');}
  finally{try{await source?.destroy()}catch{}setBusy(false);}
 }
 return <><Upload label="Choose PDF (max 30 MB)" accept="application/pdf,.pdf" onChange={e=>{setF(e.target.files?.[0]||null);setR('')}}/><label className="field"><span>Image quality</span><select value={quality} onChange={e=>setQuality(e.target.value)}><option value="0.45">Smaller file</option><option value="0.65">Balanced</option><option value="0.82">Higher quality</option></select></label><Button onClick={go}>{busy?'Optimizing…':'Compress PDF'}</Button><p role="status">{r}</p><small>This image-based compressor may reduce file size but rasterizes pages. Searchable text and interactive PDF elements are not preserved.</small></>;
}
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
function Upload({label,...p}){return <label className="upload">{label}<input type="file" {...p}/></label>}
function Tool({slug}){const map={'pdf-merge':<PDFMerge/>,'pdf-split':<PDFSplit/>,'pdf-compressor':<PDFCompress/>,'image-to-pdf':<ImagePDF/>,'passport-photo-maker':<Passport/>,'gpa-calculator':<GPA/>,'emi-calculator':<EMI/>,'salary-calculator':<Salary/>,'tax-vat-calculator':<TaxVAT/>,'invoice-generator':<Invoice/>,'cover-letter-builder':<Cover/>,'qr-scanner':<QRScan/>,'url-shortener':<Shortener/>,'json-formatter':<JSONTool/>,'favicon-generator':<Favicon/>,'meta-tag-generator':<Meta/>,'sitemap-generator':<Sitemap/>,'password-strength-checker':<Strength/>,'world-clock':<Clock/>};return map[slug]||<p>Tool not found.</p>}
export default function ToolClient({slug}){const m=META[slug]||['Tool not found',''];return <><header><Link className="brand" href="/"><b>Q</b> QuickToolBox</Link><Link href="/">← All tools</Link></header><main className={'tool tool-page tool-page-' + getToolGroup(slug) + ' tool-page-' + slug}><div className="tool-hero"><span className="tool-page-icon" aria-hidden="true">{TOOL_ICONS[slug]||'✦'}</span><div><small>QUICKTOOLBOX / {getToolGroup(slug).toUpperCase()} TOOL</small><h1>{m[0]}</h1><p>{m[1]}</p><span className="tool-private-note">✦ Simple, secure and designed for this task</span></div></div><div className="box tool-workspace"><Tool slug={slug}/></div></main><footer>© 2026 QuickToolBox</footer></>}
