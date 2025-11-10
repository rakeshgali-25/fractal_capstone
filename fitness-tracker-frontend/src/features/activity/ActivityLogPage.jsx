// src/pages/activity/ActivityLog.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/activitylog.css";

/*
  ActivityLog (connected) - updated:
  - Loads activities from /api/activities/ (expects { id, name, unit? })
  - Loads logs from /api/activity-logs/
  - Form adapts to activity unit (min, km, steps, kcal)
  - Sends payload matching backend contract:
      * duration -> duration (minutes)
      * distance_km -> distance_km
      * steps -> steps
      * calories estimated on server (sent via duration or distance depending)
  - Edit implemented as delete + create (keeps backend simple)
*/

const FIELD_FOR_UNIT = {
  min: { field: "duration", label: "Duration (minutes)", placeholder: "e.g. 30" },
  km: { field: "distance_km", label: "Distance (km)", placeholder: "e.g. 2.5" },
  steps: { field: "steps", label: "Steps", placeholder: "e.g. 1500" },
  kcal: { field: "duration", label: "Duration (minutes)", placeholder: "e.g. 30" }, // send duration, server estimates kcal
};

const emptyForm = {
  activityId: "",
  value: "",
  date: new Date().toISOString().slice(0, 10),
  unit: "", // inferred when activity chosen
};

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");

  // --- load activities & logs ---
  const loadActivities = async () => {
    try {
      const res = await api.get("/api/activities/own/");
      setActivities(res.data || []);
    } catch (err) {
      console.error("Load activities failed:", err);
      setActivities([]);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await api.get("/api/activity-logs/");
      const mapped = (res.data || []).map((l) => ({
        id: l.id,
        activityName: l.activity_name || l.goal_title || (l.goal && l.goal.activity_name) || "Activity",
        // pick whichever value exists
        duration: l.duration_minutes ?? l.duration ?? null,
        distance_km: l.distance_km ?? null,
        steps: l.steps ?? null,
        calories: l.calories ?? l.current_value ?? null,
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

  // --- helpers ---
  const resetForm = () => setForm({ ...emptyForm });
  const showTempMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const getActivityById = (id) => activities.find((a) => String(a.id) === String(id));

  // infer unit: prefer backend activity.unit, else heuristics on name
  const inferUnitForActivity = (activity) => {
    if (!activity) return "";
    if (activity.unit) {
      const u = String(activity.unit).toLowerCase();
      if (u.includes("min") || u.includes("minute")) return "min";
      if (u.includes("km") || u.includes("distance")) return "km";
      if (u.includes("step")) return "steps";
      if (u.includes("kcal") || u.includes("cal")) return "kcal";
    }
    const name = (activity.name || "").toLowerCase();
    if (name.includes("walk")) return "steps";
    if (name.includes("run") || name.includes("cycle") ) return "km";
    if (name.includes("yoga") || name.includes("gym") || name.includes("workout") || name.includes("swim")) return "min";
    return "kcal";
  };

  // Build payload according to selected unit/field
  const buildPayloadFromForm = () => {
    const activity_id = Number(form.activityId);
    const unit = form.unit || "min";
    const mapping = FIELD_FOR_UNIT[unit] || FIELD_FOR_UNIT["min"];
    const valueNum = form.value === "" ? null : Number(form.value);

    const payload = { activity_id, date: form.date };
    if (mapping.field === "duration") {
      payload.duration = Number(valueNum || 0); // backend accepts duration or duration_minutes
    } else {
      payload[mapping.field] = valueNum;
    }
    return payload;
  };

  const currentFieldConfig = () => {
    const cfg = FIELD_FOR_UNIT[form.unit] || FIELD_FOR_UNIT["min"];
    return cfg;
  };

  // --- create / update ---
  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!form.activityId || form.value === "") {
      showTempMsg("Please select activity and enter value.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        // delete old before create to keep simple backend contract
        try {
          await api.delete(`/api/activity-logs/${editing.id}/`);
        } catch (err) {
          console.error("Failed to delete before update:", err);
          throw new Error("Could not update log (delete failed).");
        }
      }

      const payload = buildPayloadFromForm();
      await api.post("/api/activity-logs/", payload);

      await loadLogs();
      resetForm();
      setEditing(null);
      showTempMsg(editing ? "Activity updated." : "Activity logged.");
    } catch (err) {
      console.error("Save failed:", err);
      const detail = err?.response?.data || err.message;
      showTempMsg("Save failed: " + (typeof detail === "string" ? detail : JSON.stringify(detail)));
    } finally {
      setSaving(false);
    }
  };

  // when activity selection changes, infer unit and clear value
  const handleActivityChange = (activityId) => {
    const act = getActivityById(activityId);
    const unit = inferUnitForActivity(act);
    setForm((prev) => ({ ...prev, activityId, unit, value: "" }));
  };

  const handleEdit = (log) => {
    // try to find activity id by name
    const match = activities.find((a) => a.name && a.name.toLowerCase() === log.activityName.toLowerCase());
    const unit = match ? inferUnitForActivity(match) : "min";
    // pick available numeric field as initial value
    const initialValue = log.duration ?? log.distance_km ?? log.steps ?? "";
    setEditing(log);
    setForm({
      activityId: match ? match.id : "",
      value: initialValue,
      date: log.date,
      unit,
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

  const activityOptions = activities.length ? activities : [{ id: "", name: "No activities available" }];
  const fieldCfg = currentFieldConfig();

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
              onChange={(e) => handleActivityChange(e.target.value)}
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
            {fieldCfg.label}
            <input
              type="number"
              step={form.unit === "km" ? "0.1" : "1"}
              min="0"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={fieldCfg.placeholder}
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
          <div>
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
              style={{ marginLeft: 8 }}
            >
              Cancel
            </button>
          </div>

          <div className="msg">{msg}</div>
        </div>
      </form>

      <div className="recent-section">
        <h3>Recent Activity</h3>

        <div className="table">
          <div className="table-head">
            <div>Activity</div>
            <div>Date</div>
            <div>Value</div>
            <div>Calories</div>
            <div></div>
          </div>

          {loading && <div className="empty">Loading...</div>}
          {!loading && logs.length === 0 && <div className="empty">No activity logged yet.</div>}

          {logs.map((log) => {
            console.log(log,"logs")
            const valueDisplay = log.duration ?? log.distance_km ?? log.steps ?? "—";
            const unitLabel = log.duration ? "min" : log.distance_km ? "km" : log.steps ? "steps" : "";
            return (
              <div className="table-row" key={log.id}>
                <div className="col activity-name">{log.activityName}</div>
                <div className="col date">{new Date(log.date).toLocaleDateString()}</div>
                <div className="col">{valueDisplay} {unitLabel}</div>
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
