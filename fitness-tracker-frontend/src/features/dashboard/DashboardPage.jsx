import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="dashboard-container">
        <h2>Welcome back 👋</h2>
        <div className="kpi-grid">
          <div className="kpi-card">
            <h4>Steps</h4>
            <h2>7,234</h2>
          </div>
          <div className="kpi-card">
            <h4>Calories Burned</h4>
            <h2>543 kcal</h2>
          </div>
          <div className="kpi-card">
            <h4>Active Minutes</h4>
            <h2>42 min</h2>
          </div>
          <div className="kpi-card">
            <h4>Goals Completed</h4>
            <h2>3/5</h2>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
