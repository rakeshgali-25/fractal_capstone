import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import '../../styles/login.css';
import "./RegisterForm"
import RegisterForm from './RegisterForm';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [isRegisterTab, setIsRegisterTab] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    console.log(form,"form")
    setBusy(true);
    setError(null);
    const res = await login(form.email, form.password);
    setBusy(false);
    if (res.ok) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Login failed');
    }
  }

  return (
    <div className="page-login">
      <div className="bg-overlay" />
      <div className="login-card">
        <h1 className="brand">FITNESS TRACKER APP</h1>

        {/* <div className="tab-row">
          <button className={`tab ${!isRegisterTab ? 'active' : ''}`} onClick={() => setIsRegisterTab(false)}>Login</button>
          <button className={`tab ${isRegisterTab ? 'active' : ''}`} onClick={() => setIsRegisterTab(true)}>Register</button>
        </div> */}

        {!isRegisterTab ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} autocomplete="off" />
            <Input autocomplete="off" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
            {error && <div className="error">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
            <Button type="submit" className="primary">{busy ? 'Signing in...' : 'Login'}</Button>
            <div className="muted">
              Don't have an account? <span className="link" onClick={() => setIsRegisterTab(true)}>Register</span>
            </div>
          </form>
        ) : (
          <div className="register-placeholder">
            <RegisterForm onBack={() => setIsRegisterTab(false)}/>
            {/* <Button onClick={() => setIsRegisterTab(false)}>Back to Login</Button> */}
          </div>
        )}

      </div>
    </div>
  );
}
