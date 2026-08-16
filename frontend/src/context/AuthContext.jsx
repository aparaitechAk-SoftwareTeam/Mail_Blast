import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('aparaitech_user');
    const savedToken = localStorage.getItem('aparaitech_token');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token, ...userData } = res.data;

    localStorage.setItem('aparaitech_user', JSON.stringify(userData));
    localStorage.setItem('aparaitech_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('aparaitech_user');
    localStorage.removeItem('aparaitech_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
