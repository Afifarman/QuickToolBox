import { ImageResponse } from 'next/og';

export const alt = 'QuickToolBox — free file, image, AI and student tools in one workspace';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0b1020 0%, #131a33 48%, #1b1140 100%)',
          color: '#f4f6ff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 800,
              background: 'linear-gradient(140deg, #7c3aed, #4f46e5 55%, #0891b2)',
            }}
          >
            Q
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
            QuickToolBox
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.05 }}>
            Every tool you need.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -2.5,
              lineHeight: 1.05,
              color: '#c4b5fd',
            }}
          >
            One quick workspace.
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#a8b3cd', marginTop: 6 }}>
            File conversion · Image tools · AI assistant · Student tools
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {['Free-first', 'No installation', 'No sign-up'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                padding: '10px 22px',
                borderRadius: 999,
                border: '1px solid rgba(167,139,250,.35)',
                background: 'rgba(124,58,237,.14)',
                fontSize: 24,
                color: '#d8d3f8',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
