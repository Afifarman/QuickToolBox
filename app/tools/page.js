import Link from 'next/link';

const tools = [
  ['pdf-merge','PDF Merge'],
  ['pdf-split','PDF Split'],
  ['pdf-compressor','PDF Compressor'],
  ['image-to-pdf','Image → PDF'],
  ['passport-photo-maker','Passport Photo Maker'],
  ['gpa-calculator','GPA/CGPA Calculator'],
  ['emi-calculator','EMI Calculator'],
  ['salary-calculator','Salary Calculator'],
  ['tax-vat-calculator','Tax/VAT Calculator'],
  ['invoice-generator','Invoice Generator'],
  ['cover-letter-builder','Cover Letter Builder'],
  ['qr-scanner','QR Scanner'],
  ['qr-generator','QR Code Generator'],
  ['url-shortener','URL Shortener'],
  ['json-formatter','JSON Formatter'],
  ['favicon-generator','Favicon Generator'],
  ['meta-tag-generator','Meta Tag Generator'],
  ['sitemap-generator','Sitemap Generator'],
  ['password-strength-checker','Password Strength Checker'],
  ['password-generator','Password Generator'],
  ['word-counter','Word Counter'],
  ['age-calculator','Age Calculator'],
  ['date-calculator','Date Calculator'],
  ['unit-converter','Unit Converter'],
  ['percentage-calculator','Percentage Calculator'],
  ['image-compressor','Image Compressor'],
  ['currency-converter','Currency Converter'],
  ['world-clock','World Clock / Timezone Converter']
];

export default function ToolsPage() {
  return (
    <main style={{maxWidth:1100,margin:'0 auto',padding:'32px 16px'}}>
      <h1>QuickToolBox – Free Online Tools</h1>
      <p>Useful PDF, image, calculator, developer, SEO and productivity tools.</p>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16,marginTop:24}}>
        {tools.map(([slug,name]) => (
          <Link key={slug} href={`/tools/${slug}`} style={{display:'block',padding:20,border:'1px solid #ddd',borderRadius:12,textDecoration:'none'}}>
            <strong>{name}</strong>
            <div style={{marginTop:8}}>Open tool →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}