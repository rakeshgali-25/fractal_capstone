// ProgressPage.jsx
import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GoalProgressItem from './GoalProgressItem';
import ProgressChart from './ProgressChart';
import '../../styles/progress.css';

/* ---------- Mock data (replace with API later) ---------- */
const mockGoals = [
  { id: 1, title: '10,000 steps daily', metric: 'steps/day', target: 10000, current: 7300 },
  { id: 2, title: 'Burn 3500 kcal weekly', metric: 'kcal/week', target: 3500, current: 2400 },
  { id: 3, title: 'Run 20 km / week', metric: 'km/week', target: 20, current: 12.4 },
  { id: 4, title: 'Do yoga 3x week', metric: 'sessions/week', target: 3, current: 2 }
];

/* mock historical progress per goal (weekly)
   shape: { id, name, values: [week1, week2, ...] }
*/
const mockHistory = [
  { id:1, name: '10k steps', values: [7000, 8200, 9000, 7300], color: '#7C4DFF' },
  { id:2, name: 'Calories', values: [3100, 2800, 2600, 2400], color: '#2E86FF' },
  { id:3, name: 'Run km', values: [8, 15, 18, 12.4], color: '#00C2A8' },
  { id:4, name: 'Yoga sessions', values: [1,2,3,2], color: '#FFB86B' }
];

const labels = ['Week -3','Week -2','Week -1','This Week'];

export default function ProgressPage() {
  const [selectedGoal, setSelectedGoal] = useState(null);

  // chart series: show all goals history
  const series = useMemo(() => mockHistory.map(h => ({ name: h.name, values: h.values, color: h.color })), []);

  // simple aggregate: percent completion for UI
  const overallPct = Math.round((mockGoals.reduce((s,g)=>s + (g.current / Math.max(1,g.target)), 0) / mockGoals.length) * 100);

  return (
    <>
      <div className="progress-top">
        <div>
          <h2>Progress</h2>
          <div className="muted">Track goal completion and historical trends</div>
        </div>

        <div className="progress-summary">
          <div className="summary-item">
            <div className="summary-title">Overall Progress</div>
            <div className="summary-value">{overallPct}%</div>
            <div className="summary-sub muted">Average completion across goals</div>
          </div>
        </div>
      </div>

      <div className="progress-body">
        <div className="left-column">
          <div className="card">
            <div className="card-head">Your goals</div>
            <div className="goals-list">
              {mockGoals.map(g => (
                <GoalProgressItem key={g.id} goal={g} onSelect={setSelectedGoal} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">Goal activity</div>
            {/* if user selected a goal, show focused chart; else show combined */}
            <ProgressChart
              series={selectedGoal ? series.filter(s => s.id === selectedGoal.id || s.name.toLowerCase().includes(selectedGoal.title.split(' ')[0].toLowerCase())) : series}
              labels={labels}
            />
          </div>
        </div>

        <div className="right-column">
          <div className="card">
            <div className="card-head">Goal details</div>
            {selectedGoal ? (
              <div className="goal-detail">
                <h3>{selectedGoal.title}</h3>
                <div className="muted">{selectedGoal.metric}</div>
                <p>Target: <b>{selectedGoal.target}</b></p>
                <p>Progress: <b>{selectedGoal.current}</b></p>
                <button className="ui-button primary" style={{ width: '100%' }}>Add progress</button>
              </div>
            ) : (
              <div className="muted">Select a goal to see details and add progress.</div>
            )}
          </div>

          <div className="card">
            <div className="card-head">Tips</div>
            <ul className="tips">
              <li>Break big goals into weekly targets.</li>
              <li>Log activities daily for accurate tracking.</li>
              <li>Enable wearable sync for automatic steps/calories.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
