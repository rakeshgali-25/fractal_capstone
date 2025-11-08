// ProgressChart.jsx
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

/**
 * Props:
 *  - series: [{ name: 'Goal A', values: [10, 20, 30], labels: ['wk1','wk2','wk3'] }, ...]
 *  - labels: ['wk1','wk2',...]
 */
export default function ProgressChart({ series = [], labels = [] }) {
  const data = useMemo(() => ({
    labels,
    datasets: series.map((s, i) => ({
      label: s.name,
      data: s.values,
      fill: false,
      tension: 0.25,
      borderWidth: 2,
      pointRadius: 3,
      borderColor: s.color || ['#7C4DFF','#2E86FF','#00C2A8','#FFB86B'][i % 4]
    }))
  }), [series, labels]);

  const options = useMemo(() => ({
    plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.85)' } } },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { display: false } },
      y: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.03)' } }
    },
    maintainAspectRatio: false
  }), []);

  return (
    <div className="progress-chart-card">
      <div style={{ height: 300 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
