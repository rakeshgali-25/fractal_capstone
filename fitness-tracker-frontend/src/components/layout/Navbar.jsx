import React, { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import "../../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2 className="brand">Fitness Tracker</h2>
      </div>

      <div className="navbar-right">
        <div className="user-info">
          <span className="user-name">{user?.username || user?.email}</span>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
