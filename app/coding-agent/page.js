import Link from 'next/link';

const phases = [
  { number: '01', title: 'Connect a private agent runtime', description: 'OpenHands runs on a machine you control. QuickToolBox stays on Vercel; it does not pretend a serverless function is a permanent coding server.' },
  { number: '02', title: 'Use a local AI model', description: 'Ollama can run a quantized coding model on your own hardware. No paid API key is required, but speed and model quality depend on your PC.' },
  { number: '03', title: 'Work in a feature branch', description: 'The agent must create an isolated branch, show every diff, and run tests before it can propose a pull request.' },
  { number: '04', title: 'Review Preview before release', description: 'Build, CI, security, and Vercel Preview checks come first. Merge and Production deployment always remain manual.' },
];

const safeguards = [
  'No direct changes to main',
  'No automatic merge or Production deployment',
  'No paid API or paid fallback',
  'No public unauthenticated agent endpoint',
  'No secret keys in browser code or localStorage',
  'No unrestricted shell or filesystem access',
];

export const metadata = {
  title: 'Web Coding Agent | QuickToolBox',
  description: 'A zero-budget, open-source coding-agent workspace with local AI and a guarded GitHub Preview workflow.',
};

export default function CodingAgentPage() {
  return (
    <main style={{ maxWidth: 1120, padding: '48px 22px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/" className="brand"><b>Q</b> QuickToolBox</Link>
        <Link href="/ai-platform" style={{ color: 'var(--qt-accent)', fontWeight: 750 }}>← AI Platform</Link>
      </div>

      <section style={{ padding: '64px 0 32px' }}>
        <span style={{ color: 'var(--qt-accent)', fontSize: 12, fontWeight: 850, letterSpacing: '.14em' }}>OPEN-SOURCE • LOCAL-FIRST • $0 SOFTWARE BUDGET</span>
        <h1 style={{ fontSize: 'clamp(42px, 7vw, 76px)', letterSpacing: '-.06em', lineHeight: 1, margin: '18px 0' }}>
          Your code. Your agent.<br /><span style={{ color: 'var(--qt-accent)' }}>Your approval.</span>
        </h1>
        <p style={{ maxWidth: 720, color: 'var(--qt-muted)', fontSize: 18, lineHeight: 1.7 }}>
          A planned OpenCode alternative for QuickToolBox, powered by OpenHands and local AI. Plan changes, inspect diffs, run tests and prepare pull requests without handing control of your production site to an autonomous agent.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
          <span style={{ border: '1px solid var(--qt-border)', borderRadius: 999, padding: '8px 13px', fontSize: 13 }}>Runtime: OpenHands</span>
          <span style={{ border: '1px solid var(--qt-border)', borderRadius: 999, padding: '8px 13px', fontSize: 13 }}>Model: Ollama local</span>
          <span style={{ border: '1px solid var(--qt-border)', borderRadius: 999, padding: '8px 13px', fontSize: 13 }}>Workflow: Branch → PR → Preview</span>
        </div>
      </section>

      <section style={{ padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
        <article style={{ background: 'var(--qt-surface)', border: '1px solid var(--qt-border)', borderRadius: 18, padding: 20 }}>
          <small>RUNTIME STATUS</small>
          <h2 style={{ margin: '12px 0 8px', fontSize: 22 }}>Not connected yet</h2>
          <p style={{ color: 'var(--qt-muted)', lineHeight: 1.6, margin: 0 }}>This first milestone adds the website foundation only. No remote agent, repository write access, or model call is enabled yet.</p>
        </article>
        <article style={{ background: 'var(--qt-surface)', border: '1px solid var(--qt-border)', borderRadius: 18, padding: 20 }}>
          <small>MODEL COST</small>
          <h2 style={{ margin: '12px 0 8px', fontSize: 22 }}>৳0 API target</h2>
          <p style={{ color: 'var(--qt-muted)', lineHeight: 1.6, margin: 0 }}>Local inference avoids provider API charges. Your PC supplies the compute, memory, storage and electricity.</p>
        </article>
        <article style={{ background: 'var(--qt-surface)', border: '1px solid var(--qt-border)', borderRadius: 18, padding: 20 }}>
          <small>RELEASE CONTROL</small>
          <h2 style={{ margin: '12px 0 8px', fontSize: 22 }}>Manual approval</h2>
          <p style={{ color: 'var(--qt-muted)', lineHeight: 1.6, margin: 0 }}>The agent may prepare a PR and Preview evidence. Merge and Production deployment are not automatic.</p>
        </article>
      </section>

      <section style={{ padding: '48px 0 20px' }}>
        <small>HOW IT WILL WORK</small>
        <h2 style={{ margin: '10px 0 20px', fontSize: 32 }}>From task to tested pull request</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
          {phases.map((phase) => (
            <article key={phase.number} style={{ border: '1px solid var(--qt-border)', background: 'var(--qt-surface)', borderRadius: 16, padding: 18 }}>
              <span style={{ color: 'var(--qt-accent)', fontWeight: 850 }}>{phase.number}</span>
              <h3 style={{ fontSize: 18, margin: '10px 0 8px' }}>{phase.title}</h3>
              <p style={{ color: 'var(--qt-muted)', lineHeight: 1.6, fontSize: 14, margin: 0 }}>{phase.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ padding: '32px 0' }}>
        <small>SAFETY BY DEFAULT</small>
        <h2 style={{ margin: '10px 0 18px', fontSize: 28 }}>What the agent is not allowed to do</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10 }}>
          {safeguards.map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--qt-border)', borderRadius: 12, padding: '12px 14px', background: 'var(--qt-surface)' }}>
              <span aria-hidden="true" style={{ color: '#16a34a', fontWeight: 900 }}>✓</span><span style={{ fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '26px 0 0', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <a className="btn" href="https://github.com/OpenHands/OpenHands" target="_blank" rel="noreferrer">OpenHands source ↗</a>
        <a className="hero-secondary" href="https://ollama.com/" target="_blank" rel="noreferrer">Ollama local models ↗</a>
        <Link className="hero-secondary" href="/ai-agent">Open existing QuickToolBox Agent →</Link>
      </section>
      <p style={{ color: 'var(--qt-muted)', fontSize: 12, lineHeight: 1.6, marginTop: 22 }}>
        Important: free software does not mean unlimited free compute. A persistent public server may incur hosting costs. The initial target is a private runtime on hardware you control. The agent will not be enabled until sandboxing and authentication are verified.
      </p>
    </main>
  );
}
