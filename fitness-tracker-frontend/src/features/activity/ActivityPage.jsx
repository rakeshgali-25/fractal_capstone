import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Input from "../../components/ui/Input";
import "../../styles/button.css";


export default function ActivityPage() {
  const [showModal, setShowModal] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [activityMessage, setActivityMessage] = useState("");
  const [messageColor, setMessageColor] = useState("green");
  const [errorMessage, setErrorMessage] = useState("");
  const [activities, setActivities] = useState([]);

  const token = localStorage.getItem("ft_access");

  const fetchActivities = async () => {
    try {
      const response = await fetch("http://127.0.0.1:7000/add-activity/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok) {
        setActivities(result.data);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSubmit = async () => {
    if (!activityName.trim()) {
      setErrorMessage("Please enter an activity name.");
      setTimeout(() => setErrorMessage(""), 2000);
      return;
    }
    try {
      const response = await fetch("http://127.0.0.1:7000/add-activity/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: activityName }),
      });
      const result = await response.json();
      if (response.ok) {
        setActivityMessage("Activity Created Successfully");
        setMessageColor("green");
        setShowModal(false);
        setActivityName("");
        setErrorMessage("");
        fetchActivities(); // Refresh list
        setTimeout(() => setActivityMessage(""), 2000);
      } else {
        setErrorMessage("This activity already exists.");
        setTimeout(() => setErrorMessage(""), 2000);
        setActivityName("");
      }
    } catch (error) {
      setErrorMessage("Network error or server not reachable.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch("http://127.0.0.1:7000/add-activity/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (response.ok) {
        setActivityMessage("Activity Deleted Successfully");
        setMessageColor("red");
        fetchActivities(); // Refresh list
        setTimeout(() => setActivityMessage(""), 2000);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h2 style={{ margin: 0 }}>Activity</h2>
      </div>
      {activityMessage && (
        <div style={{
          color: messageColor,
          fontSize: "16px",
          margin: "16px 0",
          textAlign: "center",
          fontWeight: "bold"
        }}>
          {activityMessage}
        </div>
      )}
        <button className="menu-item active" onClick={() => setShowModal(true)}>
          Add Activity
        </button>
      </div>

      {/* Activity List */}
      <div style={{ marginTop: "20px" }}>
        {activities.length === 0 ? (
          <p style={{ color: "#ccc" }}>No activities added yet.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #444" }}>
              <span>{activity.name}</span>
              <button
                className="gradient-button"
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => handleDelete(activity.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Add New Activity</h3>
            {errorMessage && (
              <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>
                {errorMessage}
              </div>
            )}
            <Input
              label="Activity Name"
              name="activityName"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="Enter activity name"
            />
            <div style={styles.buttonGroup}>
              <button className="gradient-button" onClick={handleSubmit}>
                Submit
              </button>
              <button
                className="gradient-button"
                onClick={() => {
                  setShowModal(false);
                  setErrorMessage("");
                }}
              >
                Cancel
              </button>
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


