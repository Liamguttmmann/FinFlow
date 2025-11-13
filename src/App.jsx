import React, { useMemo, useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import './styles/global.css';

function App() {
  const [theme, setTheme] = useState('light');

  const themeLabel = useMemo(() => (theme === 'light' ? 'Modo escuro' : 'Modo claro'), [theme]);

  return (
    <div className="dashboard-shell" data-theme={theme === 'dark' ? 'dark' : undefined}>
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">FinFlow</h1>
          <p style={{ color: 'var(--text-muted)' }}>Dashboard financeiro com metas inteligentes.</p>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        >
          <span role="img" aria-label="tema">
            {theme === 'light' ? '🌙' : '🌞'}
          </span>
          {themeLabel}
        </button>
      </header>
      <Dashboard />
    </div>
  );
}

export default App;
