import React, { useState } from 'react';
import api from '../../services/api';
import '../../styles/profile.css';

export default function EditProfileForm({ user = {}, onCancel, onSaved }) {
  const [form, setForm] = useState({
    username: user.username || '',
    email: user.email || '',
    weight: user.weight ?? '',
    height: user.height ?? '',
    age: user.age ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const err = {};
    if (!form.username?.trim()) err.username = 'Name is required';
    if (!form.email?.trim()) err.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Email is invalid';
    if (form.age && (Number(form.age) <= 0 || Number(form.age) > 120))
      err.age = 'Enter valid age';
    if (form.weight && Number(form.weight) < 0)
      err.weight = 'Weight must be positive';
    if (form.height && Number(form.height) < 0)
      err.height = 'Height must be positive';
    return err;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (Object.keys(v).length) {
      setError(v);
      return;
    }

    setBusy(true);
    try {
      const payload = {};
      ['username', 'email', 'weight', 'height', 'age'].forEach((k) => {
        if (form[k] !== undefined) payload[k] = form[k];
      });

      const resp = await api.patch('/profile/', payload);
      onSaved && onSaved(resp.data);
    } catch (err) {
      console.error('Profile save failed', err);
      const details = err.response?.data || err.message;
      if (typeof details === 'object') {
        setError(details);
      } else {
        setError({ server: String(details) });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">Edit Profile</div>

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <label>Full name</label>
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
        />
        {error?.username && <div className="field-error">{error.username}</div>}

        <label>Email</label>
        <input name="email" value={form.email} onChange={handleChange} />
        {error?.email && <div className="field-error">{error.email}</div>}

        <div className="row two-col">
          <div className="col">
            <label>Weight (kg)</label>
            <input
              name="weight"
              value={form.weight}
              onChange={handleChange}
              type="number"
              step="any"
            />
            {error?.weight && <div className="field-error">{error.weight}</div>}
          </div>
          <div className="col">
            <label>Height (cm)</label>
            <input
              name="height"
              value={form.height}
              onChange={handleChange}
              type="number"
              step="any"
            />
            {error?.height && <div className="field-error">{error.height}</div>}
          </div>
        </div>

        <label>Age</label>
        <input name="age" value={form.age} onChange={handleChange} type="number" />
        {error?.age && <div className="field-error">{error.age}</div>}

        {error?.server && <div className="field-error">{error.server}</div>}
        <div className="form-actions">
          <button
            type="button"
            className="ui-button neutral"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="submit" className="ui-button primary" disabled={busy}>
            {busy ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
