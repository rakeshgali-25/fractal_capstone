// ProgressPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import "../../styles/progress.css";

// Small presentational item (keeps markup consistent with your UI)
function GoalProgressItem({ goal }) {
  const pct = goal.progress_percent ?? Math.round(((goal.current_value || 0) / Math.max(1, goal.target_value || 1)) * 100);
  return (
    <div className="goal-item">
      <div className="goal-left">
        <h4 className="goal-title">{goal.title}</h4>
        <div className="goal-sub muted">{goal.unit ? `${goal.unit} • Target: ${goal.target_value}` : `Target: ${goal.target_value}`}</div>
      </div>

      <div className="goal-right">
        <div className="progress-bar-outer" aria-hidden>
          <div className="progress-bar-inner" style={{ width: `${pct}%` }} />
        </div>
        <div className="goal-meta">
          <div className="goal-pct">{pct}%</div>
          <div className="goal-numbers muted">{(goal.current_value ?? 0)} / {goal.target_value}</div>
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        // Expecting an array with each item containing:
        // { id, title, target_value, unit, current_value, progress_percent, frequency, ... }
        const res = await api.get("/api/progress/");
        if (!mounted) return;
        setGoals(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load progress:", err);
        setError("Could not load progress. Try reloading.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // overall percentage = average of each goal's percent (guard against empty)
  const overallPct = useMemo(() => {
    if (!goals || goals.length === 0) return 0;
    const sum = goals.reduce((acc, g) => acc + (Number(g.progress_percent || 0)), 0);
    return Math.round(sum / goals.length);
  }, [goals]);

  return (
    <div className="progress-page">
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

      <div className="progress-body no-chart"> {/* no-chart flag can help target CSS */}
        <div className="left-column">
          <div className="card">
            <div className="card-head">Your goals</div>

            {loading && <div className="loading muted">Loading goals…</div>}
            {error && <div className="error muted">{error}</div>}

            {!loading && goals.length === 0 && <div className="empty muted">You have no goals yet.</div>}

            <div className="goals-list">
              {goals.map((g) => (
                <GoalProgressItem key={g.id} goal={g} />
              ))}
            </div>
          </div>
        </div>

        <div className="right-column">
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
    </div>
  );
}
