// src/pages/activity/ActivityLog.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/activitylog.css";

/*
  ActivityLog (connected)
  - Loads activities from /api/activities/
  - Loads logs from /api/activity-logs/
  - Create: POST { activity_id, duration, date }
  - Delete: DELETE /api/activity-logs/:id/
  - Edit: delete old log + create new one
*/

const emptyForm = {
  activityId: "",
  duration: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");

  // load activities
  const loadActivities = async () => {
    try {
      const res = await api.get("/api/activities/");
      setActivities(res.data || []);
    } catch (err) {
      console.error("Load activities failed:", err);
      setActivities([]);
    }
  };

  // load logs
  const loadLogs = async () => {
    try {
      const res = await api.get("/api/activity-logs/");
      const mapped = (res.data || []).map((l) => ({
        id: l.id,
        activityName: l.activity_name || l.goal_title || "Activity",
        duration: l.duration_minutes ?? l.duration ?? 0,
        calories: l.calories ?? null,
        date: l.timestamp ? l.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10),
        raw: l,
      }));
      setLogs(mapped);
    } catch (err) {
      console.error("Load logs failed:", err);
      setLogs([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      setLoading(true);
      await loadActivities();
      await loadLogs();
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => setForm({ ...emptyForm });

  const showTempMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  // create or update
  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!form.activityId || !form.duration) {
      showTempMsg("Please select activity and enter duration.");
      return;
    }

    setSaving(true);
    try {
      // if editing: delete the original first
      if (editing) {
        try {
          await api.delete(`/api/activity-logs/${editing.id}/`);
        } catch (err) {
          console.error("Failed to delete before update:", err);
          throw new Error("Could not update log (failed to delete existing).");
        }
      }

      const payload = {
        activity_id: Number(form.activityId),
        duration: Number(form.duration), // backend accepts `duration` or `duration_minutes`
        date: form.date,
      };

      await api.post("/api/activity-logs/", payload);
      await loadLogs();

      showTempMsg(editing ? "Activity updated." : "Activity logged.");
      resetForm();
      setEditing(null);
    } catch (err) {
      console.error("Save failed:", err);
      const detail = err?.response?.data || err.message;
      showTempMsg("Save failed: " + (typeof detail === "string" ? detail : JSON.stringify(detail)));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (log) => {
    // find matching activity by name (best effort)
    const match = activities.find((a) => a.name && a.name.toLowerCase() === log.activityName.toLowerCase());
    setEditing(log);
    setForm({
      activityId: match ? match.id : "",
      duration: log.duration,
      date: log.date,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this log?")) return;
    try {
      await api.delete(`/api/activity-logs/${id}/`);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      showTempMsg("Deleted.");
    } catch (err) {
      console.error("Delete failed:", err);
      showTempMsg("Could not delete log.");
    }
  };

  const activityOptions = activities.length
    ? activities
    : [{ id: "", name: "No activities available" }];

  return (
    <div className="activity-log-page">
      <div className="log-top">
        <h2>Activity Log</h2>
        <p className="sub">Log your activity — calories are estimated on the server.</p>
      </div>

      <form className="log-form" onSubmit={handleAddOrUpdate}>
        <div className="row">
          <label>
            Activity
            <select
              value={form.activityId}
              onChange={(e) => setForm({ ...form, activityId: e.target.value })}
              required
              disabled={saving}
            >
              <option value="">-- Select activity --</option>
              {activityOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Duration (minutes)
            <input
              type="number"
              min="1"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="e.g. 30"
              required
              disabled={saving}
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              disabled={saving}
            />
          </label>
        </div>

        <div className="row actions">
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? (editing ? "Updating..." : "Saving...") : editing ? "Update Log" : "Add Log"}
          </button>

          <button
            type="button"
            className="muted-btn"
            onClick={() => {
              resetForm();
              setEditing(null);
            }}
            disabled={saving}
          >
            Cancel
          </button>

          <div className="msg">{msg}</div>
        </div>
      </form>

      <div className="recent-section">
        <h3>Recent Activity</h3>

        <div className="table">
          <div className="table-head">
            <div>Activity</div>
            <div>Date</div>
            <div>Duration (min)</div>
            <div>Calories</div>
            <div></div>
          </div>

          {loading && <div className="empty">Loading...</div>}
          {!loading && logs.length === 0 && <div className="empty">No activity logged yet.</div>}

          {logs.map((log) => (
            <div className="table-row" key={log.id}>
              <div className="col activity-name">{log.activityName}</div>
              <div className="col date">{new Date(log.date).toLocaleDateString()}</div>
              <div className="col">{log.duration}</div>
              <div className="col">{log.calories ?? "—"}</div>
              <div className="col actions-col">
                <button className="small-btn" onClick={() => handleEdit(log)} disabled={saving}>
                  Edit
                </button>
                <button className="small-btn danger" onClick={() => handleDelete(log.id)} disabled={saving}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
