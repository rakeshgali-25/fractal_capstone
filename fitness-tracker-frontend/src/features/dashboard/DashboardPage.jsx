// DashboardPage.jsx
import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import KpiCard from '../../components/ui/KpiCard';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import '../../styles/dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

/* ---------- Conversion helpers (examples) ---------- */

/**
 * Convert steps to kcal roughly.
 * Example: ~0.04 - 0.06 kcal per step depending on speed.
 * We'll use 0.05 kcal/step as default (10k steps => 500 kcal).
 */
function stepsToKcal(steps = 0, factor = 0.05) {
  return steps * factor;
}

/**
 * Convert duration (minutes) by activity to kcal per minute (rough).
 * These are example average kcal/min values at moderate intensity for a 70kg person:
 * - Walking: 3.5 kcal/min
 * - Running: 10 kcal/min
 * - Cycling: 8 kcal/min
 * - Yoga: 3 kcal/min
 * - Other: 4 kcal/min
 *
 * You can replace with MET * weightKg * time / 60 using accurate METs and user weight.
 */
function durationToKcal(activity, minutes = 0) {
  const base = {
    Walking: 3.5,
    Running: 10,
    Cycling: 8,
    Yoga: 3,
    Other: 4
  }[activity] ?? 4;

  // if you want to scale with weight: (MET * weightKg * minutes) / 60
  return base * minutes;
}

/**
 * Convert a single activity log into calories.
 * Log can have steps OR duration_minutes OR distance_km depending on source.
 */
function activityLogToKcal(log) {
  const activity = log.activity_type;
  // prefer direct calories if already present
  if (log.calories) return Number(log.calories);

  if (log.steps) {
    // different factor for running vs walking could be applied
    if (activity === 'Running') return stepsToKcal(log.steps, 0.07); // running step ~ higher kcal
    return stepsToKcal(log.steps, 0.05);
  }

  if (log.duration_minutes) {
    return durationToKcal(activity, Number(log.duration_minutes));
  }

  if (log.distance_km) {
    // fallback: convert km to minutes roughly (assume speed) or use distance*KCal per km
    // Example: ~60-80 kcal per km depending on intensity; use 60 kcal/km
    return Number(log.distance_km) * 60;
  }

  return 0;
}

/* ---------- Mock logs (replace with API data) ----------
 Each log should include:
  - activity_type: 'Walking'|'Running'|'Cycling'|'Yoga'|'Other'
  - activity_date: ISO or YYYY-MM-DD
  - steps (optional), duration_minutes (optional), distance_km (optional), calories (optional)
------------------------------------------------------ */
const mockLogs = [
  // Mon
  { activity_type: 'Walking', activity_date: '2025-10-20', steps: 1200 },
  { activity_type: 'Running', activity_date: '2025-10-20', duration_minutes: 30 },
  { activity_type: 'Other', activity_date: '2025-10-20', duration_minutes: 10 },

  // Tue
  { activity_type: 'Walking', activity_date: '2025-10-21', steps: 4200 },
  { activity_type: 'Running', activity_date: '2025-10-21', duration_minutes: 35 },
  { activity_type: 'Cycling', activity_date: '2025-10-21', duration_minutes: 20 },

  // Wed
  { activity_type: 'Walking', activity_date: '2025-10-22', steps: 5000 },
  { activity_type: 'Running', activity_date: '2025-10-22', duration_minutes: 50 },
  { activity_type: 'Cycling', activity_date: '2025-10-22', duration_minutes: 15 },

  // Thu
  { activity_type: 'Walking', activity_date: '2025-10-23', steps: 3800 },
  { activity_type: 'Yoga', activity_date: '2025-10-23', duration_minutes: 30 },

  // Fri
  { activity_type: 'Walking', activity_date: '2025-10-24', steps: 7400 },
  { activity_type: 'Running', activity_date: '2025-10-24', duration_minutes: 20 },
  { activity_type: 'Cycling', activity_date: '2025-10-24', duration_minutes: 40 },

  // Sat
  { activity_type: 'Walking', activity_date: '2025-10-25', steps: 8100 },
  { activity_type: 'Running', activity_date: '2025-10-25', duration_minutes: 25 },
  { activity_type: 'Cycling', activity_date: '2025-10-25', duration_minutes: 50 },

  // Sun
  { activity_type: 'Walking', activity_date: '2025-10-26', steps: 7000 },
  { activity_type: 'Running', activity_date: '2025-10-26', duration_minutes: 10 },
];

const ACTIVITY_LIST = ['Walking','Running','Cycling','Yoga','Other'];
const ACT_COLORS = {
  Walking: '#7C4DFF',
  Running: '#2E86FF',
  Cycling: '#00C2A8',
  Yoga: '#FFB86B',
  Other: '#A3A3A3'
};

/* ---------- Utility: produce labels (last N days) ---------- */
function getLastNDates(n = 7) {
  const arr = [];
  const now = new Date('2025-10-26'); // for reproducible mock; replace with new Date() in production
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = d.toISOString().slice(0,10);
    arr.push({ iso, label: d.toLocaleDateString(undefined, { weekday: 'short' }) });
  }
  return arr;
}

/* ---------- Transform logs -> datasets (kcal per day per activity) ---------- */
function buildCaloriesDatasets(logs, days, activities = ACTIVITY_LIST) {
  // init map: activity -> array of zeros (days.length)
  const map = {};
  activities.forEach(a => (map[a] = new Array(days.length).fill(0)));

  // accumulate
  logs.forEach(log => {
    const dayIndex = days.findIndex(d => d.iso === log.activity_date);
    if (dayIndex === -1) return;
    const kcal = activityLogToKcal(log);
    const act = activities.includes(log.activity_type) ? log.activity_type : 'Other';
    map[act][dayIndex] += kcal;
  });

  // produce Chart.js datasets
  const datasets = activities.map(act => ({
    label: act,
    data: map[act],
    fill: true,
    tension: 0.25,
    borderColor: ACT_COLORS[act],
    backgroundColor: hexToRgba(ACT_COLORS[act], 0.18),
    pointRadius: 2,
    borderWidth: 2
  }));

  return datasets;
}

/* small helper to convert hex to rgba for translucent fills */
function hexToRgba(hex, alpha = 0.2) {
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ---------- Dashboard component ---------- */
export default function DashboardPage() {
  const [range] = useState(7); // keep simple: 7 days
  const days = useMemo(() => getLastNDates(range), [range]); // [{iso,label}, ...]

  // Replace mockLogs with real data from API later
  const logs = mockLogs;

  // build datasets (kcal)
  const datasets = useMemo(() => buildCaloriesDatasets(logs, days), [logs, days]);

  // Chart.js data: stacked area chart where Y is kcal
  const lineData = useMemo(() => ({
    labels: days.map(d => d.label),
    datasets
  }), [days, datasets]);

  const lineOptions = useMemo(() => ({
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: 'rgba(255,255,255,0.85)' }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          // customize tooltip to show kcal value nicely
          label: ctx => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)} kcal`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.65)' } },
      y: {
        stacked: true,
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: 'rgba(255,255,255,0.65)' },
        title: { display: true, text: 'Calories (kcal)', color: 'rgba(255,255,255,0.7)' }
      }
    },
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false }
  }), []);

  // compute total calories today (sum of last day)
  const totalCaloriesToday = useMemo(() => {
    const lastIndex = days.length - 1;
    return datasets.reduce((s, ds) => s + (ds.data[lastIndex] || 0), 0);
  }, [datasets, days.length]);

  // doughnut dataset uses totals per activity over range
  const doughnutData = useMemo(() => ({
    labels: ACTIVITY_LIST,
    datasets: [{
      data: datasets.map(ds => ds.data.reduce((a,b)=>a+b, 0)),
      backgroundColor: ACTIVITY_LIST.map(a => ACT_COLORS[a]),
      hoverOffset: 6
    }]
  }), [datasets]);

  // recent activity (show kcal where possible)
  const recent = logs.slice(-6).reverse().map(log => ({
    id: `${log.activity_date}-${log.activity_type}`,
    type: log.activity_type,
    date: log.activity_date,
    kcal: Math.round(activityLogToKcal(log))
  }));

  return (
    <>
      <div className="dashboard-top">
        <div>
          <h2>Welcome back 👋</h2>
          <div className="muted">Calories-focused overview (last {range} days)</div>
        </div>
        <div className="controls">
          {/* keep as UI hook for range switching later */}
          <select defaultValue={String(range)} disabled>
            <option value="7">7d</option>
            {/* implement 30d etc later */}
          </select>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-title">Calories (today)</div>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>{Math.round(totalCaloriesToday)} kcal</div>
          <div className="kpi-sub muted">Total from all activities</div>
        </div>

        <KpiCard title="Active Minutes" value="42" unit="min" subtitle="Today" />
        <KpiCard title="Steps" value="7,234" subtitle="Today" />
        <KpiCard title="Goals" value="3/5" subtitle="Completed" />
      </div>

      <div className="charts-row improved">
        <div className="chart-card chart-large">
          <div className="card-head"><strong>Calories burned — stacked by activity</strong></div>
          <div style={{ height: 360 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        <div className="right-column">
          <div className="chart-card">
            <div className="card-head"><strong>Activity share (kcal)</strong></div>
            <div style={{ height: 220 }}>
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.8)' }}}} }/>
            </div>
          </div>

          <div className="card recent-card">
            <div className="card-head"><strong>Recent Activity (est. kcal)</strong></div>
            <ul className="recent-list">
              {recent.map(r => (
                <li key={r.id}><b>{r.type}</b> — <span className="muted">{r.date}</span> <span style={{ float: 'right' }}>{r.kcal} kcal</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
