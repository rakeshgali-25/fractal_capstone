// GoalProgressItem.jsx
import React from 'react';
import '../../styles/progress.css';

export default function GoalProgressItem({ goal, onSelect }) {
  // Map backend fields
  const current = goal.current_value ?? 0;
  const target = goal.target_value ?? 0;
  const unit = goal.unit || goal.metric || '';
  const pct = goal.progress_percent ?? (target > 0 ? Math.round((current / target) * 100) : 0);

  return (
    <div className="goal-item" onClick={() => onSelect && onSelect(goal)}>
      <div className="goal-left">
        <div className="goal-title">{goal.title}</div>
        <div className="goal-meta">{unit} • Target: {target}</div>
      </div>

      <div className="goal-right">
        <div className="goal-pct">{pct}%</div>
        <div className="progress-bar-outer">
          <div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="goal-values">
          <span className="muted">{current}</span>
          <span className="muted">/ {target}</span>
        </div>
      </div>
    </div>
  );
}
