import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import "../../styles/button.css";
import Select from "../../components/ui/Select";
import "../../styles/select.css";
import BASE_URL from "../../config/apiConfig";

export default function GoalPage() {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [goalData, setGoalData] = useState({
    activity_id: "",
    description: "",
    target_value: "",
    unit: "",
    deadline: "",
  });

  const [activities, setActivities] = useState([]);
  const [goalMessage, setGoalMessage] = useState("");
  const [messageColor, setMessageColor] = useState("green");
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);


  const token = localStorage.getItem("ft_access");

  const fetchGoals = async () => {
    try {
      const response = await fetch(`${BASE_URL}/fitness-goal/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok) {
        setGoals(result.data);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };
  

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchActivities = async () => {
  try {
    const response = await fetch(`${BASE_URL}/add-activity/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (response.ok) {
      setActivities(result.data); // assuming result.data is an array of activities
    }
  } catch (error) {
    console.error("Error fetching activities:", error);
  }
};

useEffect(() => {
  fetchGoals();
  fetchActivities(); // fetch activities when component mounts
}, []);



  const handleSubmit = async () => {
  const { activity_id, target_value, unit , deadline } = goalData;
  if (!activity_id || !target_value || !unit || !deadline) {
    setErrorMessage("Activity, target value, unit and deadline are required.");
    setTimeout(() => setErrorMessage(""), 2000);
    return;
  }

  const method = isEditing ? "PUT" : "POST";
  const url = `${BASE_URL}/fitness-goal/`;
  const body = isEditing ? { ...goalData, id: editingGoalId } : goalData;

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
      setGoalMessage(isEditing ? "Fitness Goal Updated Successfully" : "Fitness Goal Created Successfully");
      setMessageColor("green");
      setShowModal(false);
      setGoalData({
        activity_id: "",
        description: "",
        target_value: "",
        unit: "",
        deadline: "",
      });
      setIsEditing(false);
      setEditingGoalId(null);
      fetchGoals();
      setTimeout(() => setGoalMessage(""), 2000);
    } else {
      setErrorMessage("Unit must not contain numbers");
      setTimeout(() => setErrorMessage(""), 2000);
    }
  } catch (error) {
    setErrorMessage("Network error or server not reachable.");
  }
};



  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/fitness-goal/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (response.ok) {
        setGoalMessage("Fitness Goal Deleted Successfully");
        setMessageColor("red");
        fetchGoals();
        setTimeout(() => setGoalMessage(""), 2000);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Fitness Goals</h2>
        {goalMessage && (
          <div style={{
            color: messageColor,
            fontSize: "16px",
            margin: "16px 0",
            textAlign: "center",
            fontWeight: "bold"
          }}>
            {goalMessage}
          </div>
        )}
        <Button className="gradient-button compact-button" onClick={() => setShowModal(true)}>
          Add Goal
        </Button>
      </div>

      {/* Goal List */}
      <div style={{ marginTop: "20px" }}>
        {goals.length === 0 ? (
          <p style={{ color: "#ccc" }}>No fitness goals added yet.</p>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              style={{
                padding: "12px",
                marginBottom: "12px",
                border: "1px solid #444",
                borderRadius: "8px",
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ marginBottom: "6px", fontWeight: "bold" }}>
                Activity: {goal.activity_name || "N/A"}
              </div>
              <div>Description: {goal.description || "No description provided"}</div>
              <div>Target: {goal.target_value} {goal.unit}</div>
              <div>Deadline: {goal.deadline || "No deadline set"}</div>
              <div style={{ marginTop: "10px", textAlign: "right" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <Button
                  className="gradient-button compact-button"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  onClick={() => {
                    setGoalData({
                      activity_id: goal.activity_id,
                      description: goal.description,
                      target_value: goal.target_value,
                      unit: goal.unit,
                      deadline: goal.deadline,
                    });
                    setEditingGoalId(goal.id);
                    setIsEditing(true);
                    setShowModal(true);
                  }}
                >
                  Update
                </Button>

                <Button
                  className="gradient-button compact-button"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  onClick={() => handleDelete(goal.id)}
                >
                  Delete
                </Button>
              </div>

              </div>
            </div>
          ))
        )}
      </div>


      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>{isEditing ? "Update Fitness Goal" : "Add New Fitness Goal"}</h3>
            {errorMessage && (
              <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>
                {errorMessage}
              </div>
            )}
        

              {isEditing ? (
                <Input
                  name="activity_name"
                  value={
                    activities.find((a) => String(a.id) === String(goalData.activity_id))?.name || "Unknown"
                  }
                  readOnly
                  placeholder="Activity"
                />
              ) : (
                <Select
                  name="activity_id"
                  value={goalData.activity_id}
                  onChange={(e) => setGoalData({ ...goalData, activity_id: e.target.value })}
                  options={activities}
                  labelKey="name"
                  valueKey="id"
                  placeholder="Select Activity"
                />
              )}

            <Input
              name="description"
              value={goalData.description}
              onChange={(e) => setGoalData({ ...goalData, description: e.target.value })}
              placeholder="Description"
            />
            <Input
              name="target_value"
              value={goalData.target_value}
              onChange={(e) => setGoalData({ ...goalData, target_value: e.target.value })}
              placeholder="Target Value"
              type="number"
            />
            <Input
              name="unit"
              value={goalData.unit}
              onChange={(e) => setGoalData({ ...goalData, unit: e.target.value })}
              placeholder="Unit (e.g., km, minutes)"
            />
            <Input
              name="deadline"
              value={goalData.deadline}
              onChange={(e) => setGoalData({ ...goalData, deadline: e.target.value })}
              placeholder="Deadline"
              type="date"
            />
            <div style={styles.buttonGroup}>
              <Button className="gradient-button" onClick={handleSubmit}>
                Submit
              </Button>
              <Button
                className="gradient-button"
                onClick={() => {
                  setShowModal(false);
                  setErrorMessage("");
                }}
              >
                Cancel
              </Button>
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
