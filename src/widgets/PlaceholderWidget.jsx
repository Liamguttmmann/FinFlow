import React from 'react';

function PlaceholderWidget({ title, value, trend, inverted }) {
  return (
    <div className="widget-frame">
      <header className="widget-header">
        <div className="widget-header-top">
          <div>
            <h3>{title}</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Resumo rápido</p>
          </div>
        </div>
      </header>
      <div style={{ marginTop: 'auto' }}>
        <p style={{ fontSize: 32, fontWeight: 700 }}>{value}</p>
        <p style={{ color: inverted ? '#ef4444' : '#16a34a', fontWeight: 600 }}>↗ {trend}</p>
      </div>
    </div>
  );
}

export default PlaceholderWidget;
