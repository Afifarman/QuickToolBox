'use client';

import { useSiteTheme } from '../app/providers';

export default function ThemeControls({ compact = false }) {
  const { mode, accent, themes, setAccent, toggleMode, ready } = useSiteTheme();
  return (
    <div className={compact ? 'qt-theme-controls compact' : 'qt-theme-controls'} aria-label="Website appearance settings">
      <button type="button" className="qt-theme-mode" onClick={toggleMode} aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        <span aria-hidden="true">{mode === 'dark' ? '☀️' : '🌙'}</span> {mode === 'dark' ? 'Light' : 'Dark'}
      </button>
      {!compact && <label className="qt-accent-picker">Accent
        <select value={accent} onChange={event => setAccent(event.target.value)} aria-label="Accent color" disabled={!ready}>
          {Object.entries(themes).map(([key, theme]) => <option key={key} value={key}>{theme.label}</option>)}
        </select>
      </label>}
    </div>
  );
}
