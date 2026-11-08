import PhotoStudioWorkspace from "../../components/PhotoStudioWorkspace";

export const metadata = {
  title: "Free Photo Studio & Document Tools",
  description: "Create passport photo sheets, ID card print layouts and image PDFs in your browser for free.",
  alternates: { canonical: "/photo-studio" },
};

const tools = [
  { icon: "📸", title: "Passport photo sheets", description: "Arrange multiple cropped portrait photos on an A4 print sheet." },
  { icon: "🪪", title: "ID card print layout", description: "Place front and back images together at card size." },
  { icon: "📄", title: "Images to PDF", description: "Turn JPG and PNG document images into an A4 PDF." },
  { icon: "🖨️", title: "Print-ready output", description: "Export locally generated PDFs without a paid API." },
];

export default function PhotoStudioPage() {
  return (
    <main className="qt-studio-page">
      <section className="qt-studio-hero">
        <div className="qt-studio-eyebrow"><span /> QUICKTOOLBOX / PHOTO STUDIO</div>
        <h1>Your everyday <span>photo studio.</span></h1>
        <p>Prepare passport photos, ID card layouts and document PDFs in one free workspace. Your files stay in your browser while you work.</p>
        <div className="qt-studio-trust"><span>✓ Free forever</span><span>✓ No login required</span><span>✓ Local processing</span></div>
      </section>
      <section className="qt-studio-tools" aria-label="Photo studio features">
        <div className="qt-studio-tool-grid">{tools.map((tool) => <article className="qt-studio-tool-card" key={tool.title}><span>{tool.icon}</span><div><h2>{tool.title}</h2><p>{tool.description}</p></div></article>)}</div>
      </section>
      <section className="qt-studio-app-section" aria-label="Photo studio editor">
        <PhotoStudioWorkspace />
      </section>
      <section className="qt-studio-disclaimer"><strong>Important:</strong> Check official photo specifications, crop, background and print dimensions before submitting photos to a passport, visa or government service. This tool does not certify compliance with official requirements.</section>
    </main>
  );
}
