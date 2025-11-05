import React, { useState, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import '../../styles/register.css';

const GOAL_OPTIONS = [
  'Stay Fit',
  'Lose Weight',
  'Build Muscle',
  'Improve Endurance',
  'Increase Steps'
];

export default function RegisterForm({ onBack }) {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    
    password2: '',
    weight: '',
    height: '',
    age: '',
    goal: GOAL_OPTIONS[0],
  });

  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
    setServerError(null);
  }

  function validate() {
    const err = {};
    if (!form.fullName.trim()) err.fullName = 'Full name is required';
    if (!form.email.trim()) err.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Invalid email';
    if (!form.password) err.password = 'Password is required';
    else if (form.password.length < 6) err.password = 'Password must be >= 6 characters';
    if (form.password !== form.password2) err.password2 = 'Passwords do not match';
    if (form.weight && Number(form.weight) <= 0) err.weight = 'Enter valid weight';
    if (form.height && Number(form.height) <= 0) err.height = 'Enter valid height';
    if (form.age && (Number(form.age) <= 0 || Number(form.age) > 120)) err.age = 'Enter valid age';
    return err;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    const err = validate();
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }

    setBusy(true);
    try {
      // adjust endpoint payload according to your backend schema
      await api.post('/register/', {
        username: form.fullName,
        email: form.email,
        password2:form.password2,
        password: form.password,
        weight: form.weight || null,
        height: form.height || null,
        age: form.age || null,
        // goal_preference: form.goal || null
      });

      // on success, call login (so tokens are set and user is loaded)
      const res = await login(form.fullName, form.password);
      if (!res.ok) {
        setServerError(res.error || 'Registration succeeded but login failed. Please login manually.');
      } else {
        setSuccessMsg('Registration successful! Redirecting...');
      }

    } catch (err) {
      const data = err.response?.data || err.message;
      // Backend might return object of errors or string
      if (typeof data === 'object') {
        // try pick first error
        const messages = Object.values(data).flat();
        setServerError(messages.join(', ') || 'Registration failed.');
      } else {
        setServerError(String(data));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="">
      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <Input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} />
        {errors.fullName && <div className="field-error">{errors.fullName}</div>}

        <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        {errors.email && <div className="field-error">{errors.email}</div>}

        <Input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
        {errors.password && <div className="field-error">{errors.password}</div>}

        <Input name="password2" type="password" placeholder="Confirm Password" value={form.password2} onChange={handleChange} />
        {errors.password2 && <div className="field-error">{errors.password2}</div>}

        <div className="row two-col">
          <div className="col">
            <Input name="weight" type="number" placeholder="Weight (kg)" value={form.weight} onChange={handleChange} />
            {errors.weight && <div className="field-error">{errors.weight}</div>}
          </div>
          <div className="col">
            <Input name="height" type="number" placeholder="Height (cm)" value={form.height} onChange={handleChange} />
            {errors.height && <div className="field-error">{errors.height}</div>}
          </div>
        </div>

        <div className="row two-col">
          <div className="col">
            <Input name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} />
            {errors.age && <div className="field-error">{errors.age}</div>}
          </div>
          {/* <div className="col">
            <label className="ui-label">Goal Preference</label>
            <select name="goal" value={form.goal} onChange={handleChange} className="ui-select">
              {GOAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div> */}
        </div>

        {serverError && <div className="error server-error">{String(serverError)}</div>}
        {successMsg && <div className="success-msg">{successMsg}</div>}

        <div className="form-actions">
          <button type="button" className="ui-button neutral" onClick={onBack} disabled={busy}>Back to Login</button>
          <button type="submit" className="ui-button primary" disabled={busy}>
            {busy ? 'Creating account...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
}
