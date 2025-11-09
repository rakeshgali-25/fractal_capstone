import React, { useEffect, useState } from "react";
import api from "../../services/api"; // your axios helper
import "../../styles/goals.css";

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [form, setForm] = useState({
    activity: "",
    target: "",
    unit: "",
    frequency: "weekly",
  });

  // Load goals + activities
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsRes, activitiesRes] = await Promise.all([
          api.get("/api/goals/"),
          api.get("/api/activities/"),
        ]);
        setGoals(goalsRes.data || []);
        setActivities(activitiesRes.data || []);
      } catch (err) {
        console.error("Error loading goals:", err);
        // optional: show user-friendly message
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- helpers ---
  const getActivityName = (activityId) => {
    const a = activities.find((x) => Number(x.id) === Number(activityId));
    return a ? a.name : "Goal";
  };

  const groupGoals = (type) =>
    goals.filter((g) => (g.frequency || "").toLowerCase() === type);

  // --- modal open/close ---
  const openAddModal = () => {
    setEditingGoal(null);
    setForm({ activity: "", target: "", unit: "", frequency: "weekly" });
    setShowModal(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setForm({
      activity: goal.activity ?? "",
      target: goal.target_value ?? "",
      unit: goal.unit ?? "",
      frequency: goal.frequency ?? "weekly",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  // --- CRUD operations ---
  const handleDelete = async (goalId) => {
    if (!window.confirm("Delete this goal? This cannot be undone.")) return;
    try {
      await api.delete(`/api/goals/${goalId}/`);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete goal.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // basic validation
    if (!form.activity || !form.target || !form.unit || !form.frequency) {
      alert("Please fill all required fields.");
      return;
    }

    const activityId = Number(form.activity);
    const payload = {
      // backend requires title — use activity name as default
      title: getActivityName(activityId),
      activity: activityId,
      target_value: Number(form.target),
      unit: form.unit,
      frequency: form.frequency,
    };

    try {
      if (editingGoal) {
        const res = await api.put(`/api/goals/${editingGoal.id}/`, payload);
        setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? res.data : g)));
      } else {
        const res = await api.post("/api/goals/", payload);
        setGoals((prev) => [...prev, res.data]);
      }
      closeModal();
    } catch (err) {
      console.error("Save failed:", err);
      const server = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert("Could not save goal. " + server);
    }
  };

  // --- render helpers ---
  const renderGoalCard = (goal) => (
    <div key={goal.id} className="goal-card">
      <div className="goal-info">
        <h4>{goal.title || goal.activity_name}</h4>
        <p className="target-text">
          Target: {goal.target_value} {goal.unit}
        </p>
      </div>

      <div className="right-column">
        <div className="goal-progress">
          <div
            className="goal-progress-bar"
            style={{ width: `${goal.progress ?? 0}%` }}
          />
          <span className="goal-progress-text">{goal.progress ?? 0}%</span>
        </div>

        <div className="goal-actions">
          <button className="edit-btn" onClick={() => openEditModal(goal)}>
            Edit
          </button>
          <button className="delete-btn" onClick={() => handleDelete(goal.id)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <p className="loading-text">Loading goals...</p>;

  return (
    <div className="goals-page">
      <div className="goals-header">
        <h2>Your Goals</h2>
        <button className="add-goal-btn" onClick={openAddModal}>
          + Add Goal
        </button>
      </div>

      <section className="goals-section">
        <h3 className="section-title">Daily Goals</h3>
        {groupGoals("daily").length ? groupGoals("daily").map(renderGoalCard) : <p className="empty-note">No daily goals yet.</p>}
      </section>

      <section className="goals-section">
        <h3 className="section-title">Weekly Goals</h3>
        {groupGoals("weekly").length ? groupGoals("weekly").map(renderGoalCard) : <p className="empty-note">No weekly goals yet.</p>}
      </section>

      <section className="goals-section">
        <h3 className="section-title">Other Goals</h3>
        {(
          groupGoals("monthly").concat(groupGoals("one_time"))
        ).length ? (
          groupGoals("monthly").concat(groupGoals("one_time")).map(renderGoalCard)
        ) : (
          <p className="empty-note">No other goals yet.</p>
        )}
      </section>

      {showModal && (
        <div className="goal-modal">
          <div className="goal-modal-content">
            <h3>{editingGoal ? "Edit Goal" : "Add New Goal"}</h3>

            <form onSubmit={handleSave}>
              <label>Activity</label>
              <select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}>
                <option value="">Select Activity</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              <label>Target</label>
              <input
                type="number"
                placeholder="Target value"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
              />

              <label>Unit</label>
              <input
                type="text"
                placeholder="e.g. km, kcal"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />

              <label>Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="one_time">One-time</option>
              </select>

              <div className="modal-actions">
                <button type="submit" className="save-btn">{editingGoal ? "Update" : "Save"}</button>
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
