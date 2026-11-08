import PhotoStudioWorkspace from "../../components/PhotoStudioWorkspace";

export const metadata = {
  title: "Free Photo Studio & Document Tools",
  description: "Create passport photo sheets, ID card print layouts and image PDFs in your browser for free.",
  alternates: { canonical: "/photo-studio" },
};

const tools = [
  { icon: "📸", number: "01", title: "Passport photos", description: "Crop portraits and arrange print-ready photo sheets." },
  { icon: "🪪", number: "02", title: "ID card layout", description: "Set front and back card images on one A4 page." },
  { icon: "📄", number: "03", title: "Images to PDF", description: "Convert JPG and PNG files into a clean PDF." },
];

export default function PhotoStudioPage() {
  return (
    <main className="qt-studio-page">
      <section className="qt-studio-hero">
        <div className="qt-studio-hero-copy">
          <div className="qt-studio-eyebrow"><span /> THE CREATIVE DESK · QUICKTOOLBOX</div>
          <h1>Make every photo<br /><em>print-perfect.</em></h1>
          <p>A simple, beautiful workspace for passport photos, ID cards and document PDFs. Get it done in your browser—without subscriptions or complicated software.</p>
          <div className="qt-studio-hero-actions">
            <a className="qt-studio-start" href="#studio-workspace">Open photo studio <span>↗</span></a>
            <span className="qt-studio-no-cost">✦ Always free · No sign-up</span>
          </div>
          <div className="qt-studio-trust"><span>✓ Files stay on your device</span><span>✓ A4 print-ready PDFs</span></div>
        </div>
        <div className="qt-studio-visual" aria-label="Photo studio preview illustration">
          <div className="qt-studio-visual-top"><span>YOUR CREATIVE SPACE</span><span className="qt-studio-live-dot">● LOCAL</span></div>
          <div className="qt-studio-photo-stack">
            <div className="qt-studio-photo-back"><span>PHOTO SHEET</span></div>
            <div className="qt-studio-photo-front"><div className="qt-studio-portrait"><span>✦</span></div><b>35 × 45 mm</b><small>PRINT READY</small></div>
            <div className="qt-studio-float-tag">✦ 300 DPI</div>
          </div>
          <div className="qt-studio-visual-bottom"><span>01 / CROP</span><span>02 / ARRANGE</span><span>03 / EXPORT</span></div>
        </div>
      </section>

      <section className="qt-studio-tools" aria-label="Photo studio features">
        <div className="qt-studio-section-heading"><div><span>TOOLS FOR EVERYDAY</span><h2>Everything you need, in one place.</h2></div><p>Pick a tool. Add your files. Download your result.</p></div>
        <div className="qt-studio-tool-grid">{tools.map((tool) => <article className="qt-studio-tool-card" key={tool.title}><div className="qt-studio-tool-card-top"><span>{tool.icon}</span><small>{tool.number}</small></div><h3>{tool.title}</h3><p>{tool.description}</p></article>)}</div>
      </section>

      <section className="qt-studio-app-section" id="studio-workspace" aria-label="Photo studio editor">
        <div className="qt-studio-section-heading qt-studio-editor-heading"><div><span>LET'S CREATE</span><h2>Your workspace.</h2></div><p>Choose an editor below to get started.</p></div>
        <PhotoStudioWorkspace />
      </section>
      <section className="qt-studio-disclaimer"><strong>A quick note:</strong> Always check official photo specifications, crop, background and print dimensions before submitting photos to a passport, visa or government service. This tool does not certify compliance with official requirements.</section>
    </main>
  );
}
