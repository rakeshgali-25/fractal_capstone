import React, { useContext, useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AuthContext } from '../../contexts/AuthContext';
import EditProfileForm from './EditProfileForm';
import api from '../../services/api';
import '../../styles/profile.css';

export default function ProfilePage() {
  const { user, setUser } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [err, setErr] = useState(null);

  // Fetch profile on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/profile/');
        if (!mounted) return;
        setProfile(res.data);
        if (setUser) setUser(res.data);
        localStorage.setItem('ft_user', JSON.stringify(res.data));
      } catch (e) {
        console.error('Failed to fetch profile', e);
        setErr('Failed to load profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [setUser]);

  function handleSaved(updated) {
    setProfile(updated);
    if (setUser) setUser(updated);
    localStorage.setItem('ft_user', JSON.stringify(updated));
    setEditing(false);
  }

  if (loading) return <div className="empty">Loading profile...</div>;
  if (err) return <div className="empty error">{err}</div>;

  const demoUser =
    profile ||
    user || {
      username: 'Guest User',
      email: 'guest@example.com',
      weight: '',
      height: '',
      age: '',
    };

  return (
    <div className="profile-page">
      <div className="profile-left">
        <div className="profile-card">
          <div className="avatar-placeholder">
            {(demoUser.username || 'U').slice(0, 1).toUpperCase()}
          </div>

          <h3 className="profile-name">{demoUser.username}</h3>
          <div className="profile-email">{demoUser.email}</div>

          <div className="profile-stats">
            <div>
              <small className="muted">Weight</small>
              <div>{demoUser.weight || '-'} kg</div>
            </div>
            <div>
              <small className="muted">Height</small>
              <div>{demoUser.height || '-'} cm</div>
            </div>
            <div>
              <small className="muted">Age</small>
              <div>{demoUser.age || '-'}</div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              className="ui-button primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="profile-right">
        {editing ? (
          <EditProfileForm
            user={demoUser}
            onCancel={() => setEditing(false)}
            onSaved={handleSaved}
          />
        ) : (
          <div className="card">
            <div className="card-head">About</div>
            <p className="muted">
              Keep your profile up-to-date so calorie & progress calculations
              are more accurate. You can update weight, height and age anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
