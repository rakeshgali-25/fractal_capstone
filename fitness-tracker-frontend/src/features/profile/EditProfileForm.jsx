// src/features/profile/EditProfileForm.jsx
import React, { useState } from 'react';
// import api from '../../services/api'; 
import '../../styles/profile.css';

export default function EditProfileForm({ user = {}, onCancel, onSaved }) {
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    weight: user.weight || '',
    height: user.height || '',
    age: user.age || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (f) setAvatarFile(f);
  }

  function validate() {
    const err = {};
    if (!form.full_name?.trim()) err.full_name = 'Name is required';
    if (!form.email?.trim()) err.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Email is invalid';
    if (form.age && (Number(form.age) <= 0 || Number(form.age) > 120)) err.age = 'Enter valid age';
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
      // If you have a backend that accepts multipart/form-data for avatar + JSON fields:
      // Build FormData and send
      let updated = { ...user, ...form };

      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        fd.append('full_name', form.full_name);
        fd.append('email', form.email);
        fd.append('weight', form.weight || '');
        fd.append('height', form.height || '');
        fd.append('age', form.age || '');

        // Use profileService or api directly to upload
        // Example: await profileService.updateProfileWithAvatar(fd);
        // For demo, we won't actually call an endpoint; simulate avatar url:
        // const res = await api.post('/profile/upload/', fd)
        // updated.avatar_url = res.data.avatar_url;

        // Demo: create objectURL for preview (not persisted)
        updated.avatar_url = URL.createObjectURL(avatarFile);
      } else {
        // If no avatar change, call simple JSON update endpoint
        // await profileService.updateProfile(updated);
      }

      // call onSaved to update app state
      onSaved && onSaved(updated);
    } catch (err) {
      console.error(err);
      setError({ server: 'Failed to save. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">Edit Profile</div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <label>Full name</label>
        <input name="full_name" value={form.full_name} onChange={handleChange} />

        <label>Email</label>
        <input name="email" value={form.email} onChange={handleChange} />

        <div className="row two-col">
          <div className="col">
            <label>Weight (kg)</label>
            <input name="weight" value={form.weight} onChange={handleChange} type="number" />
          </div>
          <div className="col">
            <label>Height (cm)</label>
            <input name="height" value={form.height} onChange={handleChange} type="number" />
          </div>
        </div>

        <label>Age</label>
        <input name="age" value={form.age} onChange={handleChange} type="number" />

        <label>Avatar</label>
        <input type="file" accept="image/*" onChange={handleFile} />

        {error?.server && <div className="field-error">{error.server}</div>}
        <div className="form-actions">
          <button type="button" className="ui-button neutral" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className="ui-button primary" disabled={busy}>
            {busy ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
