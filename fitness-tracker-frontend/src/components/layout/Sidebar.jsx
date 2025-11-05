import React from "react";
import { NavLink } from "react-router-dom";
import "../../styles/sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>🏋️‍♂️</h3>
      </div>
      <nav className="sidebar-menu">
        <NavLink to="/dashboard" className="menu-item">
          Dashboard
        </NavLink>
        <NavLink to="/goals" className="menu-item">
          Goals
        </NavLink>
        <NavLink to="/activity" className="menu-item">
          Activity Log
        </NavLink>
        <NavLink to="/progress" className="menu-item">
          Progress
        </NavLink>
        <NavLink to="/profile" className="menu-item">
          Profile
        </NavLink>
      </nav>
    </aside>
  );
}
