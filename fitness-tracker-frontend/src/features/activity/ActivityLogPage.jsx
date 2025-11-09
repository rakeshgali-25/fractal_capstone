import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/activitylog.css";

/*
  ActivityLog (connected)
  - Loads activities from /api/activities/
  - Loads logs from /api/activity-logs/
  - Create: POST { activity_id, duration, date }
  - Delete: DELETE /api/activity-logs/:id/
  - Edit: simple flow — delete existing log and create a new one (keeps backend simple)
*/

const ActivityLog = () => {
  const [activities, setActivities] = useState([]); // {id, name}
  const [logs, setLogs] = useState([]); // logs from backend
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    activityId: "",
    duration: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [editing, setEditing] = useState(null); // editing holds the log object if in edit mode
  const [msg, setMsg] = useState("");

  // --- load activities and logs ---
  const loadActivities = async () => {
    try {
      const res = await api.get("/api/activities/");
      setActivities(res.data || []);
    } catch (err) {
      console.error("Failed to load activities", err);
      // keep silent, you can show toast
    }
  };

  const loadLogs = async () => {
    try {
      const res = await api.get("/api/activity-logs/");
      // map backend shape to UI shape
      const mapped = (res.data || []).map((l) => ({
        id: l.id,
        activityName: l.activity_name || l.goal_title || (l.goal && l.goal.activity_name) || "Activity",
        duration: l.duration_min ?? 0,
        calories: l.current_value ?? 0,
        date: l.timestamp ? l.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10),
        raw: l, // keep original if needed
      }));
      setLogs(mapped);
    } catch (err) {
      console.error("Failed to load logs", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      await loadActivities();
      await loadLogs();
      setLoading(false);
    })();
  }, []);

  // --- helpers ---
  const resetForm = () => setForm({ activityId: "", duration: "", date: new Date().toISOString().slice(0, 10) });

  const showTempMsg = (t) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 2500);
  };

  // --- create or update (we implement update as delete + create to keep backend contract simple) ---
  const handleAddOrUpdate = async (e) => {
    e.preventDefault();

    if (!form.activityId || !form.duration) {
      showTempMsg("Select activity and enter duration.");
      return;
    }

    setSaving(true);
    try {
      // if editing -> delete old log first
      if (editing) {
        try {
          await api.delete(`/api/activity-logs/${editing.id}/`);
        } catch (err) {
          // if delete fails, still attempt to create (or bail). We'll bail with an error.
          console.error("Failed to delete before update:", err);
          throw new Error("Could not update log (delete failed).");
        }
      }

      // create new log
      const payload = {
        activity_id: Number(form.activityId),
        duration: Number(form.duration),
        date: form.date,
      };

      // eslint-disable-next-line no-unused-vars
      const res = await api.post("/api/activity-logs/", payload);
      // reload logs — simple and consistent
      await loadLogs();

      resetForm();
      setEditing(null);
      showTempMsg(editing ? "Activity updated." : "Activity logged.");
    } catch (err) {
      console.error("Save failed:", err);
      const detail = err.response?.data || err.message;
      showTempMsg("Save failed: " + (typeof detail === "string" ? detail : JSON.stringify(detail)));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (log) => {
    // find matching activity id for this activity name (best-effort)
    const activity = activities.find((a) => a.name.toLowerCase() === log.activityName.toLowerCase());
    setEditing(log);
    setForm({
      activityId: activity ? activity.id : "",
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

  // --- UI render helpers ---
  const activityOptions = activities.length
    ? activities
    : [
        { id: "none", name: "No activities found (seed via admin)" },
      ];

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
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
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
                <button className="small-btn" onClick={() => handleEdit(log)}>Edit</button>
                <button className="small-btn danger" onClick={() => handleDelete(log.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
