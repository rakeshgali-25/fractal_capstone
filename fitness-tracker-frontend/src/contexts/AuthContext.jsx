import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try load existing user from localStorage (or call /me endpoint)
  useEffect(() => {
    const saved = localStorage.getItem('ft_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  async function login(username, password) {
    // call API - expects { access, refresh, user } or adjust per your backend
    try {
    const res = await api.post('/login/', { "identifier":username, password });
      // customize based on backend response shape:
      const { access, refresh, user: userData } = res.data;
      localStorage.setItem('ft_access', access);
      localStorage.setItem('ft_refresh', refresh);
      localStorage.setItem('ft_user', JSON.stringify(userData || { username }));
      setUser(userData || { username });
      return { ok: true };
    } catch (err) {
      console.error('Login failed', err);
      return { ok: false, error: err.response?.data || err.message };
    }
  }

  function logout() {
    console.log("logout")
    localStorage.removeItem('ft_access');
    localStorage.removeItem('ft_refresh');
    localStorage.removeItem('ft_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user,setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
