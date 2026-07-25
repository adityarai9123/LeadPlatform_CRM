import { createContext, useContext, useState, useCallback } from 'react';
import request from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lp_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email, password) => {
    const res = await request('/auth/login', { method: 'POST', body: { email, password } });
    setUser(res.data);
    localStorage.setItem('lp_user', JSON.stringify(res.data));
    return res.data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('lp_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
