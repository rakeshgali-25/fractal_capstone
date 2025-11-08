import React, { useState, useEffect } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import "../../styles/button.css";
import Select from "../../components/ui/Select";
import "../../styles/select.css";
import BASE_URL from "../../config/apiConfig";

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [logMessage, setLogMessage] = useState("");
  const [messageColor, setMessageColor] = useState("green");
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);

  const [logData, setLogData] = useState({
    goal_id: "",
    current_value: "",
    unit: "",
  });

  const token = localStorage.getItem("ft_access");

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${BASE_URL}/activityLog/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) setLogs(result.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await fetch(`${BASE_URL}/fitness-goal/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) setGoals(result.data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchGoals();
  }, []);

  const handleSubmit = async () => {
    const { goal_id, current_value, unit } = logData;
    if (!goal_id || !current_value || !unit) {
      setErrorMessage("Goal, value, and unit are required.");
      setTimeout(() => setErrorMessage(""), 2000);
      return;
    }

    const method = isEditing ? "PUT" : "POST";
    const url = `${BASE_URL}/activityLog/`;
    const body = isEditing ? { ...logData, id: editingLogId } : logData;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (response.ok) {
        setLogMessage(isEditing ? "Activity Log Updated" : "Activity Log Created");
        setMessageColor("green");
        setShowModal(false);
        setLogData({ goal_id: "", current_value: "", unit: "" });
        setIsEditing(false);
        setEditingLogId(null);
        fetchLogs();
        setTimeout(() => setLogMessage(""), 2000);
      } else {
        setErrorMessage("Unit must not contain numbers.");
        setTimeout(() => setErrorMessage(""), 2000);
      }
    } catch (error) {
      setErrorMessage("Network error or server not reachable.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/activityLog/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (response.ok) {
        setLogMessage("Activity Log Deleted");
        setMessageColor("red");
        fetchLogs();
        setTimeout(() => setLogMessage(""), 2000);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Activity Logs</h2>
        {logMessage && (
          <div style={{ color: messageColor, fontSize: "16px", margin: "16px 0", fontWeight: "bold" }}>
            {logMessage}
          </div>
        )}
        <Button className="gradient-button compact-button" onClick={() => setShowModal(true)}>
          Add Activity Log
        </Button>
      </div>

      {/* Log List */}
      <div style={{ marginTop: "20px" }}>
        {logs.length === 0 ? (
          <p style={{ color: "#ccc" }}>No activity logs yet.</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: "12px",
                marginBottom: "12px",
                border: "1px solid #444",
                borderRadius: "8px",
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              <div><strong>Goal:</strong> {log.activity_name || "N/A"}</div>
              <div><strong>Effort Logged:</strong> {log.current_value} {log.unit}</div>
              <div><strong>Date:</strong> {new Date(log.timestamp).toLocaleDateString()}</div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <Button
                  className="gradient-button compact-button"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  onClick={() => {
                    setLogData({
                      goal_id: log.goal_id,
                      current_value: log.current_value,
                      unit: log.unit,
                    });
                    setEditingLogId(log.id);
                    setIsEditing(true);
                    setShowModal(true);
                  }}
                >
                  Update
                </Button>
                <Button
                  className="gradient-button compact-button"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  onClick={() => handleDelete(log.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>{isEditing ? "Update Activity Log" : "Add New Activity Log"}</h3>
            {errorMessage && <div style={{ color: "red", marginBottom: "10px" }}>{errorMessage}</div>}
            {/* <Select
              name="goal_id"
              value={logData.goal_id}
              onChange={(e) => setLogData({ ...logData, goal_id: e.target.value })}
              options={goals}
              labelKey="activity_name"
              valueKey="id"
              placeholder="Select Goal"
            /> */}

            {isEditing ? (
            <Input
              name="goal_name"
              value={
                goals.find((g) => String(g.id) === String(logData.goal_id))?.activity_name || "Unknown Goal"
              }
              readOnly
              placeholder="Goal"
            />
          ) : (
            <Select
              name="goal_id"
              value={logData.goal_id}
              onChange={(e) => setLogData({ ...logData, goal_id: e.target.value })}
              options={goals}
              labelKey="activity_name"
              valueKey="id"
              placeholder="Select Goal"
            />
          )}

            <Input
              name="current_value"
              value={logData.current_value}
              onChange={(e) => setLogData({ ...logData, current_value: e.target.value })}
              placeholder="Current Value"
              type="number"
            />
            <Input
              name="unit"
              value={logData.unit}
              onChange={(e) => setLogData({ ...logData, unit: e.target.value })}
              placeholder="Unit (e.g., km, minutes)"
            />
            <div style={styles.buttonGroup}>
              <Button className="gradient-button" onClick={handleSubmit}>Submit</Button>
              <Button className="gradient-button" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: "30px",
    borderRadius: "12px",
    width: "360px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#fff",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
};



