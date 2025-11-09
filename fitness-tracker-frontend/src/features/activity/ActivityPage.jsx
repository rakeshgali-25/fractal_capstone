import React, { useState } from "react";
import "../../styles/activity.css";

const AddActivity = () => {
  const predefinedActivities = [
    { name: "Running" },
    { name: "Cycling" },
    { name: "Swimming" },
    { name: "Walking" },
    { name: "Yoga" },
    { name: "Gym Workout" },
  ];

  const [selectedActivity, setSelectedActivity] = useState("");
  const [duration, setDuration] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedActivity || !duration) {
      setMessage("Please select activity and enter duration.");
      return;
    }
    setMessage(
      `You selected ${selectedActivity} for ${duration} minutes — calories will be calculated automatically.`
    );
    setSelectedActivity("");
    setDuration("");
  };

  return (
    <div className="add-activity-page">
      <h2 className="add-activity-title">Log Your Activity</h2>

      <form onSubmit={handleSubmit} className="add-activity-form">
        <select
          value={selectedActivity}
          onChange={(e) => setSelectedActivity(e.target.value)}
          className="add-activity-dropdown"
        >
          <option value="">-- Select Activity --</option>
          {predefinedActivities.map((act, i) => (
            <option key={i} value={act.name}>
              {act.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Duration (minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="add-activity-input"
        />

        <button type="submit" className="add-activity-btn">
          Log Activity
        </button>
      </form>

      {message && <p className="activity-message">{message}</p>}
    </div>
  );
};

export default AddActivity;
