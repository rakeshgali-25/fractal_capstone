
import React, { useContext, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AuthContext } from '../../contexts/AuthContext';
import EditProfileForm from './EditProfileForm';
import '../../styles/profile.css';

export default function ProfilePage() {
  const { user, setUser } = useContext(AuthContext); // we'll assume AuthContext exposes setUser (see note)
  const [editing, setEditing] = useState(false);

  console.log("user",user)
  // fallback user shape for demo
  const demoUser = user || { username: 'Guest User', email: 'guest@example.com', weight: '', height: '', age: '', avatar_url: '' };

  console.log(demoUser,"demoUser")
  function handleSaved(updated) {
    // update AuthContext and persist
    if (setUser) setUser(updated);
    localStorage.setItem('ft_user', JSON.stringify(updated));
    setEditing(false);
  }

  return (
    <>
      <div className="profile-page">
        <div className="profile-left">
          <div className="profile-card">
            <div className="avatar-wrap">
              {demoUser.avatar_url ? (
                <img src={demoUser.avatar_url} alt="avatar" className="avatar" />
              ) : (
                <div className="avatar-placeholder">{(demoUser.username || 'U').slice(0,1).toUpperCase()}</div>
              )}
            </div>

            <h3 className="profile-name">{demoUser.username}</h3>
            <div className="profile-email">{demoUser.email}</div>

            <div className="profile-stats">
              <div><small className="muted">Weight</small><div>{demoUser.weight || '-' } kg</div></div>
              <div><small className="muted">Height</small><div>{demoUser.height || '-'} cm</div></div>
              <div><small className="muted">Age</small><div>{demoUser.age || '-'}</div></div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button className="ui-button primary" onClick={() => setEditing(true)}>Edit Profile</button>
            </div>
          </div>
        </div>

        <div className="profile-right">
          {editing ? (
            <EditProfileForm user={demoUser} onCancel={() => setEditing(false)} onSaved={handleSaved} />
          ) : (
            <div className="card">
              <div className="card-head">About</div>
              <p className="muted">Keep your profile up-to-date so calorie & progress calculations are more accurate. You can update weight, height and age. Upload an avatar to personalize your account.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
