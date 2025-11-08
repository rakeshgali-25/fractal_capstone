// GoalProgressItem.jsx
import React from 'react';
import '../../styles/progress.css';

export default function GoalProgressItem({ goal, onSelect }) {
  // goal = { id, title, metric, target, current } where current and target are numbers
  const pct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
  return (
    <div className="goal-item" onClick={() => onSelect && onSelect(goal)}>
      <div className="goal-left">
        <div className="goal-title">{goal.title}</div>
        <div className="goal-meta">{goal.metric} • Target: {goal.target}</div>
      </div>

      <div className="goal-right">
        <div className="goal-pct">{pct}%</div>
        <div className="progress-bar-outer">
          <div className="progress-bar-fill" style={{ width: `${Math.min(pct,100)}%` }} />
        </div>
        <div className="goal-values">
          <span className="muted">{goal.current}</span>
          <span className="muted">/ {goal.target}</span>
        </div>
      </div>
    </div>
  );
}
