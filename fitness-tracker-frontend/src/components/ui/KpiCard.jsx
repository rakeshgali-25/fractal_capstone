import React from 'react';
import '../../styles/dashboard.css';

export default function KpiCard({ title, value, unit, subtitle, accent }) {
  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value" style={{ color: accent || 'var(--accent)' }}>
        {value} {unit || ''}
      </div>
      {subtitle && <div className="kpi-sub">{subtitle}</div>}
    </div>
  );
}
