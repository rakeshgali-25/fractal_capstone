// ProgressPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import "../../styles/progress.css";

function GoalProgressItem({ goal }) {
  const current = goal.current_value ?? 0;
  const target = goal.target_value ?? 0;
  const unit = goal.unit || "";
  const pct =
    goal.progress_percent ??
    (target > 0 ? Math.round((current / target) * 100) : 0);

  return (
    <div className="goal-item">
      <div className="goal-left">
        <div className="goal-title">{goal.title}</div>
        <div className="goal-meta">
          {unit ? `${unit} • Target: ${target}` : `Target: ${target}`}
        </div>
      </div>

      <div className="goal-right">
        <div className="goal-pct">{pct}%</div>
        <div className="progress-bar-outer">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="goal-values">
          <span className="muted">{current}</span>
          <span className="muted">/ {target}</span>
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
    return () => {
      mounted = false;
    };
  }, []);

  const overallPct = useMemo(() => {
    if (!goals || goals.length === 0) return 0;
    const sum = goals.reduce(
      (acc, g) => acc + (Number(g.progress_percent || 0) || 0),
      0
    );
    return Math.round(sum / goals.length);
  }, [goals]);

  return (
    <div className="progress-page">
      <div className="progress-top">
        <div>
          <h2>Progress</h2>
          <div className="muted">
            Track goal completion and historical trends
          </div>
        </div>

        <div className="progress-summary">
          <div className="summary-item">
            <div className="summary-title">Overall Progress</div>
            <div className="summary-value">{overallPct}%</div>
            <div className="summary-sub muted">
              Average completion across goals
            </div>
          </div>
        </div>
      </div>

      <div className="progress-body no-chart">
        <div className="left-column">
          <div className="card">
            <div className="card-head">Your goals</div>

            {loading && <div className="loading muted">Loading goals…</div>}
            {error && <div className="error muted">{error}</div>}

            {!loading && goals.length === 0 && (
              <div className="empty muted">You have no goals yet.</div>
            )}

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
